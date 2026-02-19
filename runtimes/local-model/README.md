# Local Model Runtime Guide

This folder documents the local inference runtime used by AetherCampus.

## Runtime Engine

- Default engine: **Ollama** (containerized)
- Model volume: `data/models`
- Runtime endpoint: `http://localhost:11434`

## How it is managed

Use project root setup script:

```bash
./setup --local
```

This will:

- detect machine resources
- choose best model pool
- pull the best available model(s)
- write routing config in `infra/runtime.env`
- start local runtime container

## Verify local runtime

```bash
docker exec campus-local-model ollama list
curl http://localhost:11434/api/tags
```

## Model tiers used by backend

- `LOCAL_MODEL_FAST`
- `LOCAL_MODEL_BALANCED`
- `LOCAL_MODEL_QUALITY`

Backend chooses model tier based on prompt complexity to balance quality and speed.

## Storage and reset

Models are stored in:

- `data/models`

To reset local model cache:

```bash
docker compose -f infra/docker-compose.runtime.yml down
rm -rf data/models/*
./setup --local
```
