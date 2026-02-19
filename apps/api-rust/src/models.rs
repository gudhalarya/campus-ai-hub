use serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize, Clone, Debug)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
}

#[derive(Deserialize, Debug)]
pub struct ChatRequest {
    pub messages: Vec<ChatMessage>,
}

#[derive(Deserialize, Debug)]
pub struct UtilityGenerateRequest {
    pub template: Option<String>,
    pub prompt: String,
}

#[derive(Serialize)]
pub struct UtilityTemplate {
    pub id: &'static str,
    pub title: &'static str,
    pub description: &'static str,
}

#[derive(Serialize)]
pub struct UtilityGenerateResponse {
    pub result: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AiReport {
    pub confidence: f32,
    pub bias_warnings: Vec<String>,
    pub transparency_score: u32,
    pub model_info: String,
    pub last_query: String,
    pub route: String,
    pub cache_size: usize,
}

#[derive(Serialize)]
pub struct ErrorResponse {
    pub error: String,
}

#[derive(Serialize)]
pub struct HealthResponse {
    pub ok: bool,
    pub mode: String,
    pub model: String,
    pub routing: RoutingHealth,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RoutingHealth {
    pub smart: bool,
    pub cloud_escalation: bool,
    pub fast: String,
    pub balanced: String,
    pub quality: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MetricsResponse {
    pub requests_total: u64,
    pub chat_requests_total: u64,
    pub cache_hits_total: u64,
    pub cache_misses_total: u64,
    pub local_routes_total: u64,
    pub cloud_routes_total: u64,
    pub fallback_responses_total: u64,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum Provider {
    Local,
    Cloud,
}

#[derive(Clone, Debug)]
pub struct RouteChoice {
    pub provider: Provider,
    pub model: String,
    pub tier: String,
    pub reason: String,
}
