use bytes::Bytes;
use reqwest::Client;
use serde_json::Value;
use tokio::sync::mpsc;

use crate::config::AppConfig;
use crate::models::ChatMessage;

pub async fn stream_ollama(
    client: Client,
    cfg: AppConfig,
    model: String,
    messages: Vec<ChatMessage>,
    tx: mpsc::Sender<Bytes>,
) -> Result<String, String> {
    let payload = serde_json::json!({
        "model": model,
        "stream": true,
        "messages": messages,
        "options": {
            "temperature": cfg.local_temperature,
            "top_p": cfg.local_top_p,
            "num_ctx": cfg.local_num_ctx,
        }
    });

    let response = client
        .post(format!("{}/api/chat", cfg.local_model_base_url.trim_end_matches('/')))
        .json(&payload)
        .send()
        .await
        .map_err(|e| format!("ollama send error: {e}"))?;

    if !response.status().is_success() {
        return Err(format!("ollama status error: {}", response.status()));
    }

    let mut stream = response.bytes_stream();
    let mut buffer = String::new();
    let mut full = String::new();

    while let Some(chunk_result) = futures_util::StreamExt::next(&mut stream).await {
        let chunk = chunk_result.map_err(|e| format!("ollama stream chunk error: {e}"))?;
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

pub async fn stream_cloud(
    client: Client,
    cfg: AppConfig,
    model: String,
    messages: Vec<ChatMessage>,
    tx: mpsc::Sender<Bytes>,
) -> Result<String, String> {
    if cfg.cloud_api_key.is_empty() {
        return Err("cloud api key missing".to_string());
    }

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
        .await
        .map_err(|e| format!("cloud send error: {e}"))?;

    if !response.status().is_success() {
        return Err(format!("cloud status error: {}", response.status()));
    }

    let mut stream = response.bytes_stream();
    let mut buffer = String::new();
    let mut full = String::new();

    while let Some(chunk_result) = futures_util::StreamExt::next(&mut stream).await {
        let chunk = chunk_result.map_err(|e| format!("cloud stream chunk error: {e}"))?;
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
