# Rust API (Actix Web)

This is the production backend scaffold for AetherCampus.

## Responsibilities

- `POST /api/chat` streaming chat output
- `GET /api/utility/templates`
- `POST /api/utility/generate`
- `GET /api/ai/report`
- `GET /health`
- `GET /ready`
- `GET /metrics`

## Runtime model strategy

- local-first model routing (`fast`, `balanced`, `quality`)
- prompt complexity scoring to choose tier
- optional cloud escalation for very complex prompts
- response cache with TTL for repeat prompt latency reduction
- upstream timeout guard for stability under load

## Run with containers

Use from project root:

```bash
./setup
```

This generates `infra/runtime.env` and runs `infra/docker-compose.runtime.yml`.
