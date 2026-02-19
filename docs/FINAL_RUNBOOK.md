# AetherCampus Final Runbook

## 1. Objective

Ship a local-first AI platform that runs reliably on low-end and high-end machines, with cloud fallback only when required.

## 2. One-command setup

```bash
./setup
```

What happens automatically:

- machine profiling (CPU/RAM)
- mode selection (`local` by default, `cloud` for extreme low-end)
- local model pull + tier routing config
- container startup

## 3. Access points

- Frontend: `http://localhost:8080`
- Health: `http://localhost:8000/health`
- Ready: `http://localhost:8000/ready`
- Metrics: `http://localhost:8000/metrics`

## 4. Run modes

```bash
./setup --auto
./setup --local
./setup --cloud
./setup --no-start
```

## 5. Local model policy

Model pools:

- low: `qwen2.5:1.5b`, `phi3:mini`, `llama3.2:1b`
- mid: `qwen2.5:3b`, `llama3.2:3b`, `gemma2:2b`
- high: `qwen2.5:7b`, `llama3.1:8b`, `gemma2:9b`

Routing tiers in runtime:

- `LOCAL_MODEL_FAST`
- `LOCAL_MODEL_BALANCED`
- `LOCAL_MODEL_QUALITY`

## 6. Backend API contract

- `POST /api/chat` (streaming)
- `GET /api/utility/templates`
- `POST /api/utility/generate`
- `GET /api/ai/report`

Ops endpoints:

- `GET /health`
- `GET /ready`
- `GET /metrics`

## 7. Common operations

View logs:

```bash
docker compose -f infra/docker-compose.runtime.yml logs -f
```

Restart:

```bash
docker compose -f infra/docker-compose.runtime.yml down
docker compose -f infra/docker-compose.runtime.yml --profile local up -d --build
```

Stop:

```bash
docker compose -f infra/docker-compose.runtime.yml down
```

## 8. Demo checklist

- [ ] `./setup` finishes successfully
- [ ] `/health` returns `ok: true`
- [ ] `/ready` returns ready status
- [ ] `/workspace` streams response
- [ ] `/metrics` counters increment during usage
- [ ] UI customization and runtime settings pages are functional

## 9. PDF export

Open `docs/FINAL_RUNBOOK.html` in browser and export:

- Print -> Save as PDF
