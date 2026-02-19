# API Service

This folder now contains a lightweight runtime router (`server.js`) for hackathon use.
It supports local and cloud chat paths with zero external npm dependencies.

## Required endpoints

- `POST /api/chat` streaming response
- `GET /api/utility/templates`
- `POST /api/utility/generate`
- `GET /api/ai/report`

## Runtime behavior

- `MODE=local`: route `/api/chat` to local model runtime (Ollama/vLLM/llama.cpp)
- `MODE=cloud`: route `/api/chat` to hosted API with provided key/model
- Keep utility and report endpoints local so campus workflows stay deterministic

## Run in container

Use:

```bash
./setup
```

or:

```bash
docker compose -f infra/docker-compose.runtime.yml --profile local up -d --build
```

## Security

- Do not expose cloud keys to the browser from this service
- Add request allowlists and rate limits at the API boundary
- Log prompt/response metadata with privacy-safe redaction
