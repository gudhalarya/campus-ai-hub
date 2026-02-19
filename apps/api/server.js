const http = require("http");
const { URL } = require("url");

const PORT = Number(process.env.PORT || 8000);
const MODE = (process.env.MODE || "local").toLowerCase();
const LOCAL_MODEL_BASE_URL = process.env.LOCAL_MODEL_BASE_URL || "http://local-model:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen2.5:3b";
const CLOUD_API_BASE_URL = process.env.CLOUD_API_BASE_URL || "https://api.openai.com/v1";
const CLOUD_MODEL = process.env.CLOUD_MODEL || "gpt-4.1-mini";
const CLOUD_API_KEY = process.env.CLOUD_API_KEY || "";

let lastQuery = "";

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
      if (raw.length > 1_000_000) {
        reject(new Error("Request body too large"));
      }
    });

    req.on("end", () => {
      if (!raw) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });

    req.on("error", reject);
  });
}

async function streamFallback(res, message) {
  const words = message.split(" ");
  for (const w of words) {
    res.write(`${w} `);
    await new Promise((resolve) => setTimeout(resolve, 18));
  }
  res.end();
}

async function streamFromOllama(res, messages) {
  const response = await fetch(`${LOCAL_MODEL_BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: OLLAMA_MODEL, stream: true, messages }),
  });

  if (!response.ok || !response.body) {
    throw new Error(`Ollama error ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

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
        if (chunk) res.write(chunk);
      } catch {
        // Ignore malformed chunks.
      }
    }
  }

  res.end();
}

async function streamFromCloud(res, messages) {
  if (!CLOUD_API_KEY) {
    throw new Error("CLOUD_API_KEY not set");
  }

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
    body: JSON.stringify({ model: CLOUD_MODEL, input, stream: true }),
  });

  if (!response.ok || !response.body) {
    const text = await response.text().catch(() => "");
    throw new Error(text || `Cloud error ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

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
            res.write(json.delta);
          }
        } catch {
          // Ignore malformed event chunks.
        }
      }
    }
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
      confidence: 0.9,
      biasWarnings: [],
      transparencyScore: 91,
      modelInfo: MODE === "local" ? `local:${OLLAMA_MODEL}` : `cloud:${CLOUD_MODEL}`,
      lastQuery,
    });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/chat") {
    try {
      const body = await parseBody(req);
      const messages = Array.isArray(body.messages) ? body.messages : [];
      const latest = messages[messages.length - 1];
      lastQuery = latest?.content ? String(latest.content).slice(0, 120) : "";

      sendStreamStart(res);

      if (MODE === "cloud") {
        await streamFromCloud(res, messages);
      } else {
        await streamFromOllama(res, messages);
      }
    } catch (err) {
      if (!res.headersSent) {
        sendStreamStart(res);
      }

      await streamFallback(
        res,
        `Runtime fallback response: ${err.message || "temporary backend issue"}.` +
          " Your infrastructure is up; connect model/runtime for full output."
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
