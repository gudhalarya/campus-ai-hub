# Campus AI Hub

Campus AI Hub is a local-first web app for student-friendly AI access on a campus network.
It includes:

- A chat workspace with streaming responses
- A utility builder for template-based content generation
- A responsible AI dashboard for transparency and bias indicators

## Why this project exists

The goal is simple: make AI tools available in a controlled, private environment.
The frontend is built to connect to a local backend running on your network.

## Quick start

### 1) Prerequisites

- Node.js 18+ (Node.js 20+ recommended)
- npm

### 2) Install dependencies

```bash
npm install
```

### 3) Run the app

```bash
npm run dev
```

Vite will print a local URL (typically `http://localhost:8080`).

## Scripts

- `npm run dev` - start local development server
- `npm run build` - build production assets
- `npm run preview` - preview the production build locally
- `npm run lint` - run ESLint
- `npm run test` - run Vitest once
- `npm run test:watch` - run Vitest in watch mode

## App routes

- `/` - landing page
- `/workspace` - AI chat workspace (streaming response UI)
- `/utility-builder` - template-driven utility generation
- `/responsible-ai` - model report and safety metrics

## Backend API expectation

By default, the frontend calls:

- Base URL: `http://localhost:8000/api`

Expected endpoints:

- `POST /chat` (streaming text response)
- `POST /utility/generate` (returns generated utility output)
- `GET /ai/report` (returns responsible AI metrics)

If your backend runs elsewhere, update `API_BASE` in `src/lib/api.ts`.

## Tech stack

- React + TypeScript
- Vite
- Tailwind CSS
- shadcn/ui components
- TanStack Query
- Vitest + Testing Library

## Troubleshooting

- If you see network errors in the UI, confirm the backend is running at `localhost:8000`.
- If port `8080` is busy, Vite may prompt for another port.
- If styles or assets look stale, stop the dev server and rerun `npm run dev`.
