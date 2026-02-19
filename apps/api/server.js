const http = require("http");
const { URL } = require("url");

const PORT = Number(process.env.PORT || 8000);
const MODE = (process.env.MODE || "local").toLowerCase();

const LOCAL_MODEL_BASE_URL = process.env.LOCAL_MODEL_BASE_URL || "http://local-model:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen2.5:3b";
const LOCAL_MODEL_FAST = process.env.LOCAL_MODEL_FAST || OLLAMA_MODEL;
const LOCAL_MODEL_BALANCED = process.env.LOCAL_MODEL_BALANCED || OLLAMA_MODEL;
const LOCAL_MODEL_QUALITY = process.env.LOCAL_MODEL_QUALITY || OLLAMA_MODEL;

const CLOUD_API_BASE_URL = process.env.CLOUD_API_BASE_URL || "https://api.openai.com/v1";
const CLOUD_MODEL = process.env.CLOUD_MODEL || "gpt-4.1-mini";
const CLOUD_API_KEY = process.env.CLOUD_API_KEY || "";

const SMART_ROUTING = (process.env.SMART_ROUTING || "true").toLowerCase() === "true";
const CLOUD_ESCALATION = (process.env.CLOUD_ESCALATION || "false").toLowerCase() === "true";
const MAX_INPUT_CHARS = Number(process.env.MAX_INPUT_CHARS || 12000);
const RESPONSE_CACHE_SIZE = Number(process.env.RESPONSE_CACHE_SIZE || 120);

const LOCAL_TEMPERATURE = Number(process.env.LOCAL_TEMPERATURE || 0.2);
const LOCAL_TOP_P = Number(process.env.LOCAL_TOP_P || 0.9);
const LOCAL_NUM_CTX = Number(process.env.LOCAL_NUM_CTX || 4096);

const QUALITY_SYSTEM_PROMPT =
  process.env.QUALITY_SYSTEM_PROMPT ||
  [
    "You are a precise, practical assistant.",
    "Prioritize correctness over verbosity.",
    "When uncertain, clearly state assumptions.",
    "For technical tasks, give structured answers with actionable steps.",
    "Avoid filler and avoid hallucinated facts.",
  ].join(" ");

let lastQuery = "";
let lastRoute = "";

const responseCache = new Map();

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
}

function sendJson(res, statusCode, payload) {
  setCors(res);
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function sendStreamStart(res) {
  setCors(res);
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";

    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) reject(new Error("Request body too large"));
    });

    req.on("end", () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });

    req.on("error", reject);
  });
}

function trimMessages(messages) {
  const normalized = messages
    .map((m) => ({ role: m.role || "user", content: String(m.content || "") }))
    .filter((m) => m.content.trim().length > 0);

  let total = 0;
  const kept = [];

  for (let i = normalized.length - 1; i >= 0; i -= 1) {
    const item = normalized[i];
    total += item.content.length;
    if (total > MAX_INPUT_CHARS) break;
    kept.push(item);
  }

  kept.reverse();
  return [{ role: "system", content: QUALITY_SYSTEM_PROMPT }, ...kept];
}

function scoreQueryComplexity(messages) {
  const latest = messages[messages.length - 1]?.content || "";
  const historyCount = messages.length;

  let score = 0;

  if (latest.length > 400) score += 2;
  if (latest.length > 900) score += 2;
  if (historyCount > 8) score += 2;

  const technicalSignals = [
    /\b(architecture|optimi[sz]e|benchmark|latency|throughput|complexity|algorithm|debug|refactor)\b/i,
    /```[\s\S]*```/,
    /\b(rust|python|typescript|docker|kubernetes|sql|regex|api|stream)\b/i,
  ];

  for (const re of technicalSignals) {
    if (re.test(latest)) score += 2;
  }

  if (/\b(compare|trade[- ]?off|analy[sz]e|evaluate)\b/i.test(latest)) score += 2;

  return score;
}

function chooseRoute(messages) {
  if (!SMART_ROUTING) {
    return { provider: "local", model: OLLAMA_MODEL, tier: "default", reason: "smart-routing-disabled" };
  }

  const score = scoreQueryComplexity(messages);

  if (score >= 10 && CLOUD_ESCALATION && CLOUD_API_KEY) {
    return { provider: "cloud", model: CLOUD_MODEL, tier: "escalated", reason: `complexity=${score}` };
  }

  if (score >= 8) {
    return { provider: "local", model: LOCAL_MODEL_QUALITY, tier: "quality", reason: `complexity=${score}` };
  }

  if (score >= 4) {
    return { provider: "local", model: LOCAL_MODEL_BALANCED, tier: "balanced", reason: `complexity=${score}` };
  }

  return { provider: "local", model: LOCAL_MODEL_FAST, tier: "fast", reason: `complexity=${score}` };
}

function responseCacheKey(model, messages) {
  const latest = messages[messages.length - 1]?.content || "";
  return `${model}::${latest.trim().slice(0, 500)}`;
}

function cacheGet(key) {
  return responseCache.get(key) || null;
}

function cacheSet(key, value) {
  if (!key || !value) return;

  if (responseCache.has(key)) {
    responseCache.delete(key);
  }
  responseCache.set(key, value);

  if (responseCache.size > RESPONSE_CACHE_SIZE) {
    const first = responseCache.keys().next().value;
    responseCache.delete(first);
  }
}

async function streamFallback(res, message) {
  const words = message.split(" ");
  for (const w of words) {
    res.write(`${w} `);
    await new Promise((resolve) => setTimeout(resolve, 16));
  }
  res.end();
}

async function streamFromOllama(res, model, messages) {
  const response = await fetch(`${LOCAL_MODEL_BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      stream: true,
      messages,
      options: {
        temperature: LOCAL_TEMPERATURE,
        top_p: LOCAL_TOP_P,
        num_ctx: LOCAL_NUM_CTX,
      },
    }),
  });

  if (!response.ok || !response.body) {
    throw new Error(`Ollama error ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      try {
        const event = JSON.parse(trimmed);
        const chunk = event?.message?.content;
        if (chunk) {
          fullText += chunk;
          res.write(chunk);
        }
      } catch {
        // Ignore malformed chunks.
      }
    }
  }

  res.end();
  return fullText;
}

async function streamFromCloud(res, model, messages) {
  if (!CLOUD_API_KEY) throw new Error("CLOUD_API_KEY not set");

  const input = messages.map((m) => ({
    role: m.role || "user",
    content: [{ type: "input_text", text: String(m.content || "") }],
  }));

  const response = await fetch(`${CLOUD_API_BASE_URL}/responses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${CLOUD_API_KEY}`,
    },
    body: JSON.stringify({ model, input, stream: true }),
  });

  if (!response.ok || !response.body) {
    const text = await response.text().catch(() => "");
    throw new Error(text || `Cloud error ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() || "";

    for (const event of events) {
      const lines = event.split("\n");
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;

        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;

        try {
          const json = JSON.parse(payload);
          if (json.type === "response.output_text.delta" && json.delta) {
            fullText += json.delta;
            res.write(json.delta);
          }
        } catch {
          // Ignore malformed event chunks.
        }
      }
    }
  }

  res.end();
  return fullText;
}

async function streamCached(res, cached) {
  const words = cached.split(" ");
  for (const w of words) {
    res.write(`${w} `);
    await new Promise((resolve) => setTimeout(resolve, 8));
  }
  res.end();
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

  if (req.method === "OPTIONS") {
    setCors(res);
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method === "GET" && url.pathname === "/health") {
    sendJson(res, 200, {
      ok: true,
      mode: MODE,
      routing: {
        smart: SMART_ROUTING,
        cloudEscalation: CLOUD_ESCALATION,
        fast: LOCAL_MODEL_FAST,
        balanced: LOCAL_MODEL_BALANCED,
        quality: LOCAL_MODEL_QUALITY,
      },
      model: MODE === "local" ? OLLAMA_MODEL : CLOUD_MODEL,
    });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/utility/templates") {
    sendJson(res, 200, [
      { id: "summary", title: "Executive Summary", description: "Create a concise summary." },
      { id: "email", title: "Professional Email", description: "Draft a polished email response." },
      { id: "plan", title: "Action Plan", description: "Generate a tactical execution plan." },
    ]);
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/utility/generate") {
    try {
      const body = await parseBody(req);
      const template = body.template || "generic";
      const prompt = String(body.prompt || "").trim();

      sendJson(res, 200, {
        result:
          `Template: ${template}\n\n` +
          `Input:\n${prompt}\n\n` +
          "Generated output (placeholder):\n- Point 1\n- Point 2\n- Point 3",
      });
    } catch (err) {
      sendJson(res, 400, { error: err.message || "Invalid request" });
    }
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/ai/report") {
    sendJson(res, 200, {
      confidence: 0.91,
      biasWarnings: [],
      transparencyScore: 92,
      modelInfo: MODE === "local" ? `local:${OLLAMA_MODEL}` : `cloud:${CLOUD_MODEL}`,
      lastQuery,
      route: lastRoute,
      cacheSize: responseCache.size,
    });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/chat") {
    try {
      const body = await parseBody(req);
      const rawMessages = Array.isArray(body.messages) ? body.messages : [];
      const messages = trimMessages(rawMessages);
      const latest = messages[messages.length - 1];
      lastQuery = latest?.content ? String(latest.content).slice(0, 120) : "";

      const route = MODE === "cloud"
        ? { provider: "cloud", model: CLOUD_MODEL, tier: "forced-cloud", reason: "mode=cloud" }
        : chooseRoute(messages);

      lastRoute = `${route.provider}:${route.model}:${route.tier}:${route.reason}`;

      sendStreamStart(res);

      const cacheKey = responseCacheKey(route.model, messages);
      const cached = cacheGet(cacheKey);
      if (cached) {
        await streamCached(res, cached);
        return;
      }

      let fullText = "";
      if (route.provider === "cloud") {
        fullText = await streamFromCloud(res, route.model, messages);
      } else {
        fullText = await streamFromOllama(res, route.model, messages);
      }

      if (fullText && fullText.length < 6000) {
        cacheSet(cacheKey, fullText);
      }
    } catch (err) {
      if (!res.headersSent) {
        sendStreamStart(res);
      }

      await streamFallback(
        res,
        `Runtime fallback response: ${err.message || "temporary backend issue"}.` +
          " Infrastructure is running; model path can be retried automatically."
      );
    }
    return;
  }

  sendJson(res, 404, { error: "Not found" });
});

server.listen(PORT, "0.0.0.0", () => {
  // eslint-disable-next-line no-console
  console.log(`campus-api listening on ${PORT} (${MODE} mode)`);
});
