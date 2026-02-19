use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Mutex;

use reqwest::Client;

use crate::cache::LruTtlCache;
use crate::config::AppConfig;

pub struct RuntimeMetrics {
    pub requests_total: AtomicU64,
    pub chat_requests_total: AtomicU64,
    pub cache_hits_total: AtomicU64,
    pub cache_misses_total: AtomicU64,
    pub local_routes_total: AtomicU64,
    pub cloud_routes_total: AtomicU64,
    pub fallback_responses_total: AtomicU64,
}

impl RuntimeMetrics {
    pub fn new() -> Self {
        Self {
            requests_total: AtomicU64::new(0),
            chat_requests_total: AtomicU64::new(0),
            cache_hits_total: AtomicU64::new(0),
            cache_misses_total: AtomicU64::new(0),
            local_routes_total: AtomicU64::new(0),
            cloud_routes_total: AtomicU64::new(0),
            fallback_responses_total: AtomicU64::new(0),
        }
    }

    pub fn incr_requests(&self) {
        self.requests_total.fetch_add(1, Ordering::Relaxed);
    }

    pub fn incr_chat(&self) {
        self.chat_requests_total.fetch_add(1, Ordering::Relaxed);
    }

    pub fn incr_cache_hit(&self) {
        self.cache_hits_total.fetch_add(1, Ordering::Relaxed);
    }

    pub fn incr_cache_miss(&self) {
        self.cache_misses_total.fetch_add(1, Ordering::Relaxed);
    }

    pub fn incr_local_route(&self) {
        self.local_routes_total.fetch_add(1, Ordering::Relaxed);
    }

    pub fn incr_cloud_route(&self) {
        self.cloud_routes_total.fetch_add(1, Ordering::Relaxed);
    }

    pub fn incr_fallback(&self) {
        self.fallback_responses_total.fetch_add(1, Ordering::Relaxed);
    }
}

pub struct AppState {
    pub cfg: AppConfig,
    pub client: Client,
    pub cache: Mutex<LruTtlCache>,
    pub last_query: Mutex<String>,
    pub last_route: Mutex<String>,
    pub metrics: RuntimeMetrics,
}
