# API Service Blueprint

Use this service as the runtime router between local and cloud providers.

## Required endpoints

- `POST /api/chat` streaming response
- `GET /api/utility/templates`
- `POST /api/utility/generate`
- `GET /api/ai/report`

## Runtime behavior

- `MODE=local`: route `/api/chat` to local model runtime (Ollama/vLLM/llama.cpp)
- `MODE=cloud`: route `/api/chat` to hosted API with provided key/model
- Keep utility and report endpoints local so campus workflows stay deterministic

## Security

- Do not expose cloud keys to the browser from this service
- Add request allowlists and rate limits at the API boundary
- Log prompt/response metadata with privacy-safe redaction
