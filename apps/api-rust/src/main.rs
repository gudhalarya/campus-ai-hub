use std::collections::{HashMap, VecDeque};
use std::env;
use std::sync::Mutex;

use actix_cors::Cors;
use actix_web::error::ErrorInternalServerError;
use actix_web::{get, post, web, App, HttpResponse, HttpServer, Responder};
use bytes::Bytes;
use futures_util::StreamExt;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use tokio::sync::mpsc;
use tokio_stream::wrappers::ReceiverStream;

#[derive(Clone)]
struct Config {
    port: u16,
    mode: String,
    local_model_base_url: String,
    ollama_model: String,
    local_model_fast: String,
    local_model_balanced: String,
    local_model_quality: String,
    cloud_api_base_url: String,
    cloud_model: String,
    cloud_api_key: String,
    smart_routing: bool,
    cloud_escalation: bool,
    max_input_chars: usize,
    local_temperature: f32,
    local_top_p: f32,
    local_num_ctx: u32,
    response_cache_size: usize,
    quality_system_prompt: String,
}

impl Config {
    fn from_env() -> Self {
        let ollama_model = env_var("OLLAMA_MODEL", "qwen2.5:3b");

        Self {
            port: env_var("PORT", "8000").parse().unwrap_or(8000),
            mode: env_var("MODE", "local").to_lowercase(),
            local_model_base_url: env_var("LOCAL_MODEL_BASE_URL", "http://local-model:11434"),
            ollama_model: ollama_model.clone(),
            local_model_fast: env_var("LOCAL_MODEL_FAST", &ollama_model),
            local_model_balanced: env_var("LOCAL_MODEL_BALANCED", &ollama_model),
            local_model_quality: env_var("LOCAL_MODEL_QUALITY", &ollama_model),
            cloud_api_base_url: env_var("CLOUD_API_BASE_URL", "https://api.openai.com/v1"),
            cloud_model: env_var("CLOUD_MODEL", "gpt-4.1-mini"),
            cloud_api_key: env_var("CLOUD_API_KEY", ""),
            smart_routing: env_var("SMART_ROUTING", "true").to_lowercase() == "true",
            cloud_escalation: env_var("CLOUD_ESCALATION", "false").to_lowercase() == "true",
            max_input_chars: env_var("MAX_INPUT_CHARS", "12000").parse().unwrap_or(12000),
            local_temperature: env_var("LOCAL_TEMPERATURE", "0.2").parse().unwrap_or(0.2),
            local_top_p: env_var("LOCAL_TOP_P", "0.9").parse().unwrap_or(0.9),
            local_num_ctx: env_var("LOCAL_NUM_CTX", "4096").parse().unwrap_or(4096),
            response_cache_size: env_var("RESPONSE_CACHE_SIZE", "120").parse().unwrap_or(120),
            quality_system_prompt: env_var(
                "QUALITY_SYSTEM_PROMPT",
                "You are a precise, practical assistant. Prioritize correctness over verbosity. When uncertain, clearly state assumptions. For technical tasks, give structured, actionable responses. Avoid hallucinated facts.",
            ),
        }
    }
}

fn env_var(key: &str, default: &str) -> String {
    env::var(key).unwrap_or_else(|_| default.to_string())
}

#[derive(Deserialize, Serialize, Clone)]
struct ChatMessage {
    role: String,
    content: String,
}

#[derive(Deserialize)]
struct ChatRequest {
    messages: Vec<ChatMessage>,
}

#[derive(Deserialize)]
struct UtilityGenerateRequest {
    template: Option<String>,
    prompt: String,
}

#[derive(Serialize)]
struct UtilityTemplate {
    id: &'static str,
    title: &'static str,
    description: &'static str,
}

#[derive(Serialize)]
struct UtilityGenerateResponse {
    result: String,
}

#[derive(Serialize)]
struct AiReport {
    confidence: f32,
    biasWarnings: Vec<String>,
    transparencyScore: u32,
    modelInfo: String,
    lastQuery: String,
    route: String,
    cacheSize: usize,
}

#[derive(Serialize)]
struct Health {
    ok: bool,
    mode: String,
    model: String,
    routing: RoutingConfig,
}

#[derive(Serialize)]
struct RoutingConfig {
    smart: bool,
    cloudEscalation: bool,
    fast: String,
    balanced: String,
    quality: String,
}

#[derive(Clone)]
struct RouteChoice {
    provider: Provider,
    model: String,
    tier: String,
    reason: String,
}

#[derive(Clone, PartialEq)]
enum Provider {
    Local,
    Cloud,
}

struct SimpleLru {
    map: HashMap<String, String>,
    order: VecDeque<String>,
    capacity: usize,
}

impl SimpleLru {
    fn new(capacity: usize) -> Self {
        Self {
            map: HashMap::new(),
            order: VecDeque::new(),
            capacity,
        }
    }

    fn get(&mut self, key: &str) -> Option<String> {
        if let Some(value) = self.map.get(key).cloned() {
            self.touch(key);
            return Some(value);
        }
        None
    }

    fn put(&mut self, key: String, value: String) {
        if self.map.contains_key(&key) {
            self.map.insert(key.clone(), value);
            self.touch(&key);
            return;
        }

        self.map.insert(key.clone(), value);
        self.order.push_back(key);

        while self.map.len() > self.capacity {
            if let Some(oldest) = self.order.pop_front() {
                self.map.remove(&oldest);
            }
        }
    }

    fn touch(&mut self, key: &str) {
        self.order.retain(|k| k != key);
        self.order.push_back(key.to_string());
    }

    fn len(&self) -> usize {
        self.map.len()
    }
}

struct AppState {
    cfg: Config,
    client: Client,
    last_query: Mutex<String>,
    last_route: Mutex<String>,
    cache: Mutex<SimpleLru>,
}

#[get("/health")]
async fn health(data: web::Data<AppState>) -> impl Responder {
    let model = if data.cfg.mode == "local" {
        data.cfg.ollama_model.clone()
    } else {
        data.cfg.cloud_model.clone()
    };

    HttpResponse::Ok().json(Health {
        ok: true,
        mode: data.cfg.mode.clone(),
        model,
        routing: RoutingConfig {
            smart: data.cfg.smart_routing,
            cloudEscalation: data.cfg.cloud_escalation,
            fast: data.cfg.local_model_fast.clone(),
            balanced: data.cfg.local_model_balanced.clone(),
            quality: data.cfg.local_model_quality.clone(),
        },
    })
}

#[get("/api/utility/templates")]
async fn utility_templates() -> impl Responder {
    HttpResponse::Ok().json(vec![
        UtilityTemplate {
            id: "summary",
            title: "Executive Summary",
            description: "Create a concise summary.",
        },
        UtilityTemplate {
            id: "email",
            title: "Professional Email",
            description: "Draft a polished email response.",
        },
        UtilityTemplate {
            id: "plan",
            title: "Action Plan",
            description: "Generate a tactical execution plan.",
        },
    ])
}

#[post("/api/utility/generate")]
async fn utility_generate(payload: web::Json<UtilityGenerateRequest>) -> impl Responder {
    let template = payload.template.clone().unwrap_or_else(|| "generic".to_string());
    let result = format!(
        "Template: {template}\n\nInput:\n{}\n\nGenerated output (placeholder):\n- Point 1\n- Point 2\n- Point 3",
        payload.prompt.trim()
    );

    HttpResponse::Ok().json(UtilityGenerateResponse { result })
}

#[get("/api/ai/report")]
async fn ai_report(data: web::Data<AppState>) -> impl Responder {
    let last_query = data
        .last_query
        .lock()
        .map(|v| v.clone())
        .unwrap_or_else(|_| String::new());
    let last_route = data
        .last_route
        .lock()
        .map(|v| v.clone())
        .unwrap_or_else(|_| String::new());
    let cache_size = data.cache.lock().map(|v| v.len()).unwrap_or(0);

    let model_info = if data.cfg.mode == "local" {
        format!("local:{}", data.cfg.ollama_model)
    } else {
        format!("cloud:{}", data.cfg.cloud_model)
    };

    HttpResponse::Ok().json(AiReport {
        confidence: 0.91,
        biasWarnings: vec![],
        transparencyScore: 92,
        modelInfo: model_info,
        lastQuery: last_query,
        route: last_route,
        cacheSize: cache_size,
    })
}

#[post("/api/chat")]
async fn chat(data: web::Data<AppState>, payload: web::Json<ChatRequest>) -> actix_web::Result<HttpResponse> {
    let trimmed = trim_messages(
        payload.messages.clone(),
        data.cfg.max_input_chars,
        &data.cfg.quality_system_prompt,
    );

    let latest = trimmed.last().map(|m| m.content.clone()).unwrap_or_default();
    if let Ok(mut q) = data.last_query.lock() {
        *q = latest.chars().take(120).collect();
    }

    let route = if data.cfg.mode == "cloud" {
        RouteChoice {
            provider: Provider::Cloud,
            model: data.cfg.cloud_model.clone(),
            tier: "forced-cloud".to_string(),
            reason: "mode=cloud".to_string(),
        }
    } else {
        choose_route(&data.cfg, &trimmed)
    };

    if let Ok(mut r) = data.last_route.lock() {
        *r = format!("{}:{}:{}:{}", provider_label(&route.provider), route.model, route.tier, route.reason);
    }

    let cache_key = response_cache_key(&route.model, &trimmed);
    if let Ok(mut cache) = data.cache.lock() {
        if let Some(cached) = cache.get(&cache_key) {
            let stream = futures_util::stream::once(async move {
                Ok::<Bytes, actix_web::Error>(Bytes::from(cached))
            });
            return Ok(HttpResponse::Ok()
                .content_type("text/plain; charset=utf-8")
                .streaming(stream));
        }
    }

    let client = data.client.clone();
    let cfg = data.cfg.clone();
    let cache_state = data.clone();
    let model = route.model.clone();
    let provider = route.provider.clone();

    let (tx, rx) = mpsc::channel::<Bytes>(64);

    tokio::spawn(async move {
        let result = if provider == Provider::Cloud {
            stream_cloud(client, cfg, model.clone(), trimmed.clone(), tx.clone()).await
        } else {
            stream_ollama(client, cfg, model.clone(), trimmed.clone(), tx.clone()).await
        };

        if let Ok(full_text) = result {
            if !full_text.is_empty() && full_text.len() < 6000 {
                if let Ok(mut cache) = cache_state.cache.lock() {
                    cache.put(cache_key, full_text);
                }
            }
        } else {
            let _ = tx
                .send(Bytes::from(
                    "Runtime fallback response: backend route failed. Retry should recover automatically.",
                ))
                .await;
        }
    });

    let stream = ReceiverStream::new(rx).map(Ok::<Bytes, actix_web::Error>);

    Ok(HttpResponse::Ok()
        .content_type("text/plain; charset=utf-8")
        .streaming(stream))
}

fn provider_label(provider: &Provider) -> &'static str {
    match provider {
        Provider::Local => "local",
        Provider::Cloud => "cloud",
    }
}

fn trim_messages(messages: Vec<ChatMessage>, max_chars: usize, system_prompt: &str) -> Vec<ChatMessage> {
    let mut normalized: Vec<ChatMessage> = messages
        .into_iter()
        .filter(|m| !m.content.trim().is_empty())
        .map(|m| ChatMessage {
            role: if m.role.is_empty() { "user".to_string() } else { m.role },
            content: m.content,
        })
        .collect();

    let mut total = 0usize;
    let mut kept: Vec<ChatMessage> = Vec::new();

    while let Some(item) = normalized.pop() {
        total += item.content.len();
        if total > max_chars {
            break;
        }
        kept.push(item);
    }

    kept.reverse();
    let mut with_system = vec![ChatMessage {
        role: "system".to_string(),
        content: system_prompt.to_string(),
    }];
    with_system.extend(kept);
    with_system
}

fn score_query_complexity(messages: &[ChatMessage]) -> i32 {
    let latest = messages.last().map(|m| m.content.as_str()).unwrap_or_default();
    let history_count = messages.len();

    let mut score = 0;

    if latest.len() > 400 {
        score += 2;
    }
    if latest.len() > 900 {
        score += 2;
    }
    if history_count > 8 {
        score += 2;
    }

    let signal_terms = [
        "architecture",
        "optimize",
        "benchmark",
        "latency",
        "throughput",
        "algorithm",
        "debug",
        "refactor",
        "docker",
        "rust",
        "typescript",
        "api",
        "stream",
    ];

    let lower = latest.to_lowercase();
    for term in signal_terms {
        if lower.contains(term) {
            score += 1;
        }
    }

    if latest.contains("```") {
        score += 2;
    }

    score
}

fn choose_route(cfg: &Config, messages: &[ChatMessage]) -> RouteChoice {
    if !cfg.smart_routing {
        return RouteChoice {
            provider: Provider::Local,
            model: cfg.ollama_model.clone(),
            tier: "default".to_string(),
            reason: "smart-routing-disabled".to_string(),
        };
    }

    let score = score_query_complexity(messages);

    if score >= 10 && cfg.cloud_escalation && !cfg.cloud_api_key.is_empty() {
        return RouteChoice {
            provider: Provider::Cloud,
            model: cfg.cloud_model.clone(),
            tier: "escalated".to_string(),
            reason: format!("complexity={score}"),
        };
    }

    if score >= 8 {
        return RouteChoice {
            provider: Provider::Local,
            model: cfg.local_model_quality.clone(),
            tier: "quality".to_string(),
            reason: format!("complexity={score}"),
        };
    }

    if score >= 4 {
        return RouteChoice {
            provider: Provider::Local,
            model: cfg.local_model_balanced.clone(),
            tier: "balanced".to_string(),
            reason: format!("complexity={score}"),
        };
    }

    RouteChoice {
        provider: Provider::Local,
        model: cfg.local_model_fast.clone(),
        tier: "fast".to_string(),
        reason: format!("complexity={score}"),
    }
}

fn response_cache_key(model: &str, messages: &[ChatMessage]) -> String {
    let latest = messages.last().map(|m| m.content.as_str()).unwrap_or_default();
    let trimmed: String = latest.chars().take(500).collect();
    format!("{model}::{trimmed}")
}

async fn stream_ollama(
    client: Client,
    cfg: Config,
    model: String,
    messages: Vec<ChatMessage>,
    tx: mpsc::Sender<Bytes>,
) -> Result<String, reqwest::Error> {
    let payload = serde_json::json!({
        "model": model,
        "stream": true,
        "messages": messages,
        "options": {
            "temperature": cfg.local_temperature,
            "top_p": cfg.local_top_p,
            "num_ctx": cfg.local_num_ctx
        }
    });

    let response = client
        .post(format!("{}/api/chat", cfg.local_model_base_url.trim_end_matches('/')))
        .json(&payload)
        .send()
        .await?;

    let mut stream = response.bytes_stream();
    let mut buffer = String::new();
    let mut full = String::new();

    while let Some(chunk_result) = stream.next().await {
        let chunk = chunk_result?;
        buffer.push_str(&String::from_utf8_lossy(&chunk));

        while let Some(pos) = buffer.find('\n') {
            let line = buffer[..pos].trim().to_string();
            buffer = buffer[pos + 1..].to_string();

            if line.is_empty() {
                continue;
            }

            if let Ok(event) = serde_json::from_str::<Value>(&line) {
                if let Some(part) = event
                    .get("message")
                    .and_then(|m| m.get("content"))
                    .and_then(Value::as_str)
                {
                    full.push_str(part);
                    let _ = tx.send(Bytes::from(part.to_string())).await;
                }
            }
        }
    }

    Ok(full)
}

async fn stream_cloud(
    client: Client,
    cfg: Config,
    model: String,
    messages: Vec<ChatMessage>,
    tx: mpsc::Sender<Bytes>,
) -> Result<String, reqwest::Error> {
    let input: Vec<Value> = messages
        .into_iter()
        .map(|m| {
            serde_json::json!({
                "role": m.role,
                "content": [{"type": "input_text", "text": m.content}]
            })
        })
        .collect();

    let response = client
        .post(format!("{}/responses", cfg.cloud_api_base_url.trim_end_matches('/')))
        .bearer_auth(cfg.cloud_api_key)
        .json(&serde_json::json!({
            "model": model,
            "input": input,
            "stream": true
        }))
        .send()
        .await?;

    let mut stream = response.bytes_stream();
    let mut buffer = String::new();
    let mut full = String::new();

    while let Some(chunk_result) = stream.next().await {
        let chunk = chunk_result?;
        buffer.push_str(&String::from_utf8_lossy(&chunk));

        while let Some(pos) = buffer.find("\n\n") {
            let event = buffer[..pos].to_string();
            buffer = buffer[pos + 2..].to_string();

            for line in event.lines() {
                if !line.starts_with("data:") {
                    continue;
                }
                let payload = line[5..].trim();
                if payload.is_empty() || payload == "[DONE]" {
                    continue;
                }

                if let Ok(json) = serde_json::from_str::<Value>(payload) {
                    if json.get("type") == Some(&Value::String("response.output_text.delta".to_string())) {
                        if let Some(delta) = json.get("delta").and_then(Value::as_str) {
                            full.push_str(delta);
                            let _ = tx.send(Bytes::from(delta.to_string())).await;
                        }
                    }
                }
            }
        }
    }

    Ok(full)
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let cfg = Config::from_env();
    let bind = format!("0.0.0.0:{}", cfg.port);

    let state = web::Data::new(AppState {
        cfg: cfg.clone(),
        client: Client::builder()
            .use_rustls_tls()
            .pool_max_idle_per_host(8)
            .build()
            .map_err(|e| std::io::Error::other(format!("reqwest client init failed: {e}")))?,
        last_query: Mutex::new(String::new()),
        last_route: Mutex::new(String::new()),
        cache: Mutex::new(SimpleLru::new(cfg.response_cache_size)),
    });

    println!(
        "campus-api (rust/actix) listening on {} mode={} local_model={} cloud_model={}",
        bind, cfg.mode, cfg.ollama_model, cfg.cloud_model
    );

    HttpServer::new(move || {
        App::new()
            .app_data(state.clone())
            .wrap(Cors::permissive())
            .service(health)
            .service(utility_templates)
            .service(utility_generate)
            .service(ai_report)
            .service(chat)
            .default_service(web::route().to(|| async {
                HttpResponse::NotFound().json(serde_json::json!({ "error": "Not found" }))
            }))
    })
    .bind(bind)?
    .run()
    .await
    .map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, ErrorInternalServerError(e).to_string()))
}
