use actix_web::{get, post, web, HttpResponse, Responder};
use bytes::Bytes;
use futures_util::StreamExt;
use serde_json::json;
use tokio::sync::mpsc;
use tokio::time::{timeout, Duration};
use tokio_stream::wrappers::ReceiverStream;

use crate::models::{
    AiReport, ChatMessage, ChatRequest, ErrorResponse, HealthResponse, MetricsResponse, Provider,
    RouteChoice, RoutingHealth, UtilityGenerateRequest, UtilityGenerateResponse, UtilityTemplate,
};
use crate::providers::{stream_cloud, stream_ollama};
use crate::state::AppState;

#[get("/health")]
pub async fn health(data: web::Data<AppState>) -> impl Responder {
    let model = if data.cfg.mode == "local" {
        data.cfg.ollama_model.clone()
    } else {
        data.cfg.cloud_model.clone()
    };

    HttpResponse::Ok().json(HealthResponse {
        ok: true,
        mode: data.cfg.mode.clone(),
        model,
        routing: RoutingHealth {
            smart: data.cfg.smart_routing,
            cloud_escalation: data.cfg.cloud_escalation,
            fast: data.cfg.local_model_fast.clone(),
            balanced: data.cfg.local_model_balanced.clone(),
            quality: data.cfg.local_model_quality.clone(),
        },
    })
}

#[get("/ready")]
pub async fn ready(data: web::Data<AppState>) -> impl Responder {
    if data.cfg.mode == "cloud" {
        if data.cfg.cloud_api_key.is_empty() {
            return HttpResponse::ServiceUnavailable().json(ErrorResponse {
                error: "cloud mode configured but CLOUD_API_KEY is missing".to_string(),
            });
        }
        return HttpResponse::Ok().json(json!({"ok": true, "mode": "cloud"}));
    }

    let url = format!(
        "{}/api/tags",
        data.cfg.local_model_base_url.trim_end_matches('/')
    );

    match timeout(
        Duration::from_millis(data.cfg.upstream_timeout_ms.min(4000)),
        data.client.get(url).send(),
    )
    .await
    {
        Ok(Ok(resp)) if resp.status().is_success() => {
            HttpResponse::Ok().json(json!({"ok": true, "mode": "local"}))
        }
        _ => HttpResponse::ServiceUnavailable().json(ErrorResponse {
            error: "local model runtime is not ready".to_string(),
        }),
    }
}

#[get("/metrics")]
pub async fn metrics(data: web::Data<AppState>) -> impl Responder {
    use std::sync::atomic::Ordering;

    HttpResponse::Ok().json(MetricsResponse {
        requests_total: data.metrics.requests_total.load(Ordering::Relaxed),
        chat_requests_total: data.metrics.chat_requests_total.load(Ordering::Relaxed),
        cache_hits_total: data.metrics.cache_hits_total.load(Ordering::Relaxed),
        cache_misses_total: data.metrics.cache_misses_total.load(Ordering::Relaxed),
        local_routes_total: data.metrics.local_routes_total.load(Ordering::Relaxed),
        cloud_routes_total: data.metrics.cloud_routes_total.load(Ordering::Relaxed),
        fallback_responses_total: data.metrics.fallback_responses_total.load(Ordering::Relaxed),
    })
}

#[get("/api/utility/templates")]
pub async fn utility_templates(data: web::Data<AppState>) -> impl Responder {
    data.metrics.incr_requests();

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
pub async fn utility_generate(
    data: web::Data<AppState>,
    payload: web::Json<UtilityGenerateRequest>,
) -> impl Responder {
    data.metrics.incr_requests();

    if payload.prompt.trim().is_empty() {
        return HttpResponse::BadRequest().json(ErrorResponse {
            error: "prompt cannot be empty".to_string(),
        });
    }

    let template = payload
        .template
        .clone()
        .unwrap_or_else(|| "generic".to_string());

    let result = format!(
        "Template: {template}\n\nInput:\n{}\n\nGenerated output (placeholder):\n- Point 1\n- Point 2\n- Point 3",
        payload.prompt.trim()
    );

    HttpResponse::Ok().json(UtilityGenerateResponse { result })
}

#[get("/api/ai/report")]
pub async fn ai_report(data: web::Data<AppState>) -> impl Responder {
    data.metrics.incr_requests();

    let last_query = data
        .last_query
        .lock()
        .map(|v| v.clone())
        .unwrap_or_default();
    let last_route = data
        .last_route
        .lock()
        .map(|v| v.clone())
        .unwrap_or_default();
    let cache_size = data.cache.lock().map(|v| v.len()).unwrap_or(0);

    let model_info = if data.cfg.mode == "local" {
        format!("local:{}", data.cfg.ollama_model)
    } else {
        format!("cloud:{}", data.cfg.cloud_model)
    };

    HttpResponse::Ok().json(AiReport {
        confidence: 0.92,
        bias_warnings: vec![],
        transparency_score: 93,
        model_info,
        last_query,
        route: last_route,
        cache_size,
    })
}

#[post("/api/chat")]
pub async fn chat(
    data: web::Data<AppState>,
    payload: web::Json<ChatRequest>,
) -> actix_web::Result<HttpResponse> {
    data.metrics.incr_requests();
    data.metrics.incr_chat();

    if payload.messages.is_empty() {
        return Ok(HttpResponse::BadRequest().json(ErrorResponse {
            error: "messages cannot be empty".to_string(),
        }));
    }

    let messages = trim_messages(
        payload.messages.clone(),
        data.cfg.max_input_chars,
        &data.cfg.quality_system_prompt,
    );

    let latest = messages
        .last()
        .map(|m| m.content.clone())
        .unwrap_or_default();
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
        choose_route(data.get_ref(), &messages)
    };

    match route.provider {
        Provider::Local => data.metrics.incr_local_route(),
        Provider::Cloud => data.metrics.incr_cloud_route(),
    }

    if let Ok(mut r) = data.last_route.lock() {
        *r = format!(
            "{}:{}:{}:{}",
            provider_label(&route.provider),
            route.model,
            route.tier,
            route.reason
        );
    }

    let cache_key = response_cache_key(&route.model, &messages);
    if let Ok(mut cache) = data.cache.lock() {
        if let Some(cached) = cache.get(&cache_key) {
            data.metrics.incr_cache_hit();
            let stream = futures_util::stream::once(async move {
                Ok::<Bytes, actix_web::Error>(Bytes::from(cached))
            });
            return Ok(HttpResponse::Ok()
                .content_type("text/plain; charset=utf-8")
                .streaming(stream));
        }
    }

    data.metrics.incr_cache_miss();

    let client = data.client.clone();
    let cfg = data.cfg.clone();
    let app_state = data.clone();
    let model = route.model.clone();
    let provider = route.provider.clone();
    let timeout_ms = cfg.upstream_timeout_ms;

    let (tx, rx) = mpsc::channel::<Bytes>(64);

    tokio::spawn(async move {
        let fut = async {
            if provider == Provider::Cloud {
                stream_cloud(client, cfg, model.clone(), messages.clone(), tx.clone()).await
            } else {
                stream_ollama(client, cfg, model.clone(), messages.clone(), tx.clone()).await
            }
        };

        let result = timeout(Duration::from_millis(timeout_ms), fut).await;

        match result {
            Ok(Ok(full_text)) => {
                if !full_text.is_empty() && full_text.len() < 8000 {
                    if let Ok(mut cache) = app_state.cache.lock() {
                        cache.put(cache_key, full_text);
                    }
                }
            }
            Ok(Err(err)) => {
                app_state.metrics.incr_fallback();
                let _ = tx
                    .send(Bytes::from(format!(
                        "Runtime fallback response: {}. Infrastructure is up; retry should recover.",
                        err
                    )))
                    .await;
            }
            Err(_) => {
                app_state.metrics.incr_fallback();
                let _ = tx
                    .send(Bytes::from(
                        "Runtime fallback response: upstream timeout. Infrastructure is up; retry should recover."
                            .to_string(),
                    ))
                    .await;
            }
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
            role: if m.role.is_empty() {
                "user".to_string()
            } else {
                m.role
            },
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

    let lower = latest.to_lowercase();
    for term in [
        "architecture",
        "optimize",
        "benchmark",
        "latency",
        "throughput",
        "algorithm",
        "debug",
        "refactor",
        "rust",
        "typescript",
        "docker",
        "api",
        "stream",
    ] {
        if lower.contains(term) {
            score += 1;
        }
    }

    if latest.contains("```") {
        score += 2;
    }

    score
}

fn choose_route(data: &AppState, messages: &[ChatMessage]) -> RouteChoice {
    if !data.cfg.smart_routing {
        return RouteChoice {
            provider: Provider::Local,
            model: data.cfg.ollama_model.clone(),
            tier: "default".to_string(),
            reason: "smart-routing-disabled".to_string(),
        };
    }

    let score = score_query_complexity(messages);

    if score >= 10 && data.cfg.cloud_escalation && !data.cfg.cloud_api_key.is_empty() {
        return RouteChoice {
            provider: Provider::Cloud,
            model: data.cfg.cloud_model.clone(),
            tier: "escalated".to_string(),
            reason: format!("complexity={score}"),
        };
    }

    if score >= 8 {
        return RouteChoice {
            provider: Provider::Local,
            model: data.cfg.local_model_quality.clone(),
            tier: "quality".to_string(),
            reason: format!("complexity={score}"),
        };
    }

    if score >= 4 {
        return RouteChoice {
            provider: Provider::Local,
            model: data.cfg.local_model_balanced.clone(),
            tier: "balanced".to_string(),
            reason: format!("complexity={score}"),
        };
    }

    RouteChoice {
        provider: Provider::Local,
        model: data.cfg.local_model_fast.clone(),
        tier: "fast".to_string(),
        reason: format!("complexity={score}"),
    }
}

fn response_cache_key(model: &str, messages: &[ChatMessage]) -> String {
    let latest = messages.last().map(|m| m.content.as_str()).unwrap_or_default();
    let trimmed: String = latest.chars().take(500).collect();
    format!("{model}::{trimmed}")
}
