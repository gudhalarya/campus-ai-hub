# AetherCampus

AetherCampus is a local-first web app for student-friendly AI access on a campus network.
It includes:

- A chat workspace with streaming responses
- A utility builder for template-based content generation
- A responsible AI dashboard for transparency and bias indicators
- Runtime switching between local inference and cloud API mode

## Core goal

Build once, run anywhere:

- `local mode`: full local package (server + local model runtime/container) for high-volume usage on your own hardware
- `cloud mode`: optional hosted API usage with API key + model when you want external inference

## Quick start

### 1) Prerequisites

- Node.js 18+ (Node.js 20+ recommended)
- npm

### 2) Install dependencies

```bash
npm install
```

### 3) Optional env setup

```bash
cp .env.example .env
```

### 4) Run the app

```bash
npm run dev
```

Vite will print a local URL (typically `http://localhost:8080`).

## Auto setup for low-end machines

Use the `setup` script to auto-detect machine resources, choose local vs cloud mode, tune runtime values, and start containers.

```bash
./setup
```

Useful modes:

```bash
./setup --auto      # detect + choose best mode (default)
./setup --local     # force offline/local mode
./setup --cloud     # force cloud mode
./setup --no-start  # only generate infra/runtime.env
```

What it does:

- detects CPU cores, RAM, and architecture
- classifies machine as `extreme`, `low`, `mid`, or `high`
- auto-selects mode:
  - `extreme` -> cloud mode
  - otherwise -> local mode
- writes optimized runtime config to `infra/runtime.env`
- starts containers from `infra/docker-compose.runtime.yml`
- in local mode, auto-pulls the best available Ollama model from a tiered model pool
- configures smart routing tiers: `LOCAL_MODEL_FAST`, `LOCAL_MODEL_BALANCED`, `LOCAL_MODEL_QUALITY`
- enables API-side quality/speed features: complexity routing + response cache

Container endpoints after setup:

- Web: `http://localhost:8080`
- API health: `http://localhost:8000/health`
- Local model runtime (local mode): `http://localhost:11434`

Local model pools used by `setup`:

- low machines: `qwen2.5:1.5b`, `phi3:mini`, `llama3.2:1b`
- mid machines: `qwen2.5:3b`, `llama3.2:3b`, `gemma2:2b`
- high machines: `qwen2.5:7b`, `llama3.1:8b`, `gemma2:9b`

Local optimization strategy:

- low machine: pull 1 model (fast tier only)
- mid machine: pull 2 models (fast + balanced)
- high machine: pull 3 models (fast + balanced + quality)
- runtime router chooses tier by prompt complexity and stays local by default
- cloud escalation is optional (`CLOUD_ESCALATION=true`) for very hard prompts

## Runtime settings

Open `/runtime-settings` in the app to configure runtime behavior.

Configurable fields:

- runtime mode: `local` or `cloud`
- local base URL (default `http://localhost:8000/api`)
- cloud base URL (default `https://api.openai.com/v1`)
- cloud model (default `gpt-4.1-mini`)
- cloud API key (saved in browser local storage)

Notes:

- `local mode` supports all current routes/endpoints (`/chat`, `/utility/*`, `/ai/report`).
- `cloud mode` currently supports chat streaming from the workspace page.
- utility builder and responsible-ai endpoints remain local-backend features.

## App routes

- `/` - landing page
- `/workspace` - AI chat workspace (streaming response UI)
- `/utility-builder` - template-driven utility generation
- `/responsible-ai` - model report and safety metrics
- `/appearance` - live UI customization controls
- `/runtime-settings` - local/cloud runtime configuration

## Suggested full-package architecture

Use this structure to ship a complete local sandbox package with optional cloud fallback:

```text
campus-ai-hub/
  apps/
    web/                 # this frontend (Vite)
    api/                 # local backend gateway
  runtimes/
    local-model/         # Ollama/vLLM/llama.cpp container + model volumes
  infra/
    docker-compose.yml   # one-command local stack
  data/
    models/              # local model files
```

Recommended local API behavior (`apps/api`):

- `/api/chat` routes to local model runtime when mode is local
- `/api/chat` routes to hosted provider when mode is cloud + API key
- `/api/utility/*` and `/api/ai/report` generated in local backend
- enforce allowlist + rate controls at backend layer even for local installs

## Scripts

- `npm run dev` - start local development server
- `npm run build` - build production assets
- `npm run preview` - preview the production build locally
- `npm run lint` - run ESLint
- `npm run test` - run Vitest once
- `npm run test:watch` - run Vitest in watch mode

## Tech stack

- React + TypeScript
- Vite
- Tailwind CSS
- shadcn/ui components
- TanStack Query
- Vitest + Testing Library

## Troubleshooting

- If you see network errors in local mode, confirm backend is running at your configured local base URL.
- If cloud mode fails, verify API key/model/base URL in `/runtime-settings`.
- If port `8080` is busy, Vite may prompt for another port.
