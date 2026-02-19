use std::env;

#[derive(Clone, Debug)]
pub struct AppConfig {
    pub port: u16,
    pub mode: String,

    pub local_model_base_url: String,
    pub ollama_model: String,
    pub local_model_fast: String,
    pub local_model_balanced: String,
    pub local_model_quality: String,

    pub cloud_api_base_url: String,
    pub cloud_model: String,
    pub cloud_api_key: String,

    pub smart_routing: bool,
    pub cloud_escalation: bool,

    pub max_input_chars: usize,
    pub local_temperature: f32,
    pub local_top_p: f32,
    pub local_num_ctx: u32,

    pub response_cache_size: usize,
    pub response_cache_ttl_seconds: u64,

    pub upstream_timeout_ms: u64,
    pub quality_system_prompt: String,
}

impl AppConfig {
    pub fn from_env() -> Self {
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

            smart_routing: env_bool("SMART_ROUTING", true),
            cloud_escalation: env_bool("CLOUD_ESCALATION", false),

            max_input_chars: env_var("MAX_INPUT_CHARS", "12000")
                .parse()
                .unwrap_or(12000),
            local_temperature: env_var("LOCAL_TEMPERATURE", "0.2").parse().unwrap_or(0.2),
            local_top_p: env_var("LOCAL_TOP_P", "0.9").parse().unwrap_or(0.9),
            local_num_ctx: env_var("LOCAL_NUM_CTX", "4096").parse().unwrap_or(4096),

            response_cache_size: env_var("RESPONSE_CACHE_SIZE", "120")
                .parse()
                .unwrap_or(120),
            response_cache_ttl_seconds: env_var("RESPONSE_CACHE_TTL_SECONDS", "900")
                .parse()
                .unwrap_or(900),

            upstream_timeout_ms: env_var("UPSTREAM_TIMEOUT_MS", "90000")
                .parse()
                .unwrap_or(90000),
            quality_system_prompt: env_var(
                "QUALITY_SYSTEM_PROMPT",
                "You are a precise, practical assistant. Prioritize correctness over verbosity. When uncertain, clearly state assumptions. For technical tasks, produce structured and actionable responses. Avoid hallucinations.",
            ),
        }
    }

    pub fn validate(&self) -> Result<(), String> {
        if self.port == 0 {
            return Err("PORT must be greater than 0".to_string());
        }

        if self.mode != "local" && self.mode != "cloud" {
            return Err("MODE must be either 'local' or 'cloud'".to_string());
        }

        if self.max_input_chars < 1000 {
            return Err("MAX_INPUT_CHARS is too low; expected >= 1000".to_string());
        }

        if self.response_cache_size == 0 {
            return Err("RESPONSE_CACHE_SIZE must be greater than 0".to_string());
        }

        if self.upstream_timeout_ms < 1000 {
            return Err("UPSTREAM_TIMEOUT_MS must be >= 1000".to_string());
        }

        Ok(())
    }
}

fn env_var(key: &str, default: &str) -> String {
    env::var(key).unwrap_or_else(|_| default.to_string())
}

fn env_bool(key: &str, default: bool) -> bool {
    match env::var(key) {
        Ok(v) => {
            let normalized = v.to_lowercase();
            normalized == "true" || normalized == "1" || normalized == "yes"
        }
        Err(_) => default,
    }
}
