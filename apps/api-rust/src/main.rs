mod cache;
mod config;
mod models;
mod providers;
mod routes;
mod state;

use std::io;
use std::sync::Mutex;

use actix_cors::Cors;
use actix_web::http::header;
use actix_web::middleware::{DefaultHeaders, Logger, NormalizePath};
use actix_web::{web, App, HttpResponse, HttpServer};
use reqwest::Client;
use tracing::{error, info};

use crate::cache::LruTtlCache;
use crate::config::AppConfig;
use crate::models::ErrorResponse;
use crate::state::{AppState, RuntimeMetrics};

#[actix_web::main]
async fn main() -> io::Result<()> {
    init_tracing();

    let cfg = AppConfig::from_env();
    if let Err(msg) = cfg.validate() {
        error!("invalid configuration: {}", msg);
        return Err(io::Error::new(io::ErrorKind::InvalidInput, msg));
    }

    let bind = format!("0.0.0.0:{}", cfg.port);

    let client = Client::builder()
        .use_rustls_tls()
        .pool_max_idle_per_host(8)
        .pool_idle_timeout(std::time::Duration::from_secs(20))
        .tcp_keepalive(std::time::Duration::from_secs(30))
        .build()
        .map_err(|e| io::Error::other(format!("reqwest client init failed: {e}")))?;

    let state = web::Data::new(AppState {
        cfg: cfg.clone(),
        client,
        cache: Mutex::new(LruTtlCache::new(
            cfg.response_cache_size,
            cfg.response_cache_ttl_seconds,
        )),
        last_query: Mutex::new(String::new()),
        last_route: Mutex::new(String::new()),
        metrics: RuntimeMetrics::new(),
    });

    info!(
        "campus-api (rust/actix) listening on {} mode={} local_model={} cloud_model={}",
        bind, cfg.mode, cfg.ollama_model, cfg.cloud_model
    );

    HttpServer::new(move || {
        App::new()
            .app_data(state.clone())
            .app_data(web::JsonConfig::default().limit(1_000_000))
            .wrap(
                Cors::default()
                    .allow_any_origin()
                    .allow_any_method()
                    .allow_any_header()
                    .max_age(3600),
            )
            .wrap(DefaultHeaders::new().add((header::X_CONTENT_TYPE_OPTIONS, "nosniff")))
            .wrap(Logger::default())
            .wrap(NormalizePath::trim())
            .service(routes::health)
            .service(routes::ready)
            .service(routes::metrics)
            .service(routes::utility_templates)
            .service(routes::utility_generate)
            .service(routes::ai_report)
            .service(routes::chat)
            .default_service(web::route().to(|| async {
                HttpResponse::NotFound().json(ErrorResponse {
                    error: "Not found".to_string(),
                })
            }))
    })
    .shutdown_timeout(15)
    .bind(bind)?
    .run()
    .await
}

fn init_tracing() {
    let filter = tracing_subscriber::EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| tracing_subscriber::EnvFilter::new("info"));

    tracing_subscriber::fmt()
        .with_env_filter(filter)
        .with_target(false)
        .compact()
        .init();
}
