import { getProviderConfig } from "@/lib/provider-config";

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

export interface StreamCallbacks {
  onChunk: (chunk: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
}

interface ChatMessage {
  role: string;
  content: string;
}

function trimTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

function endpointSupportsCloud(endpoint: string): boolean {
  return endpoint === "/chat";
}

async function streamLocal(
  endpoint: string,
  body: Record<string, unknown>,
  callbacks: StreamCallbacks
): Promise<void> {
  const cfg = getProviderConfig();
  const baseUrl = trimTrailingSlash(cfg.localBaseUrl);

  const res = await fetch(`${baseUrl}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    callbacks.onError(`Error ${res.status}`);
    return;
  }

  const reader = res.body?.getReader();
  if (!reader) {
    callbacks.onError("No stream available");
    return;
  }

  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    callbacks.onChunk(decoder.decode(value, { stream: true }));
  }

  callbacks.onDone();
}

async function streamCloudChat(
  body: Record<string, unknown>,
  callbacks: StreamCallbacks
): Promise<void> {
  const cfg = getProviderConfig();
  if (!cfg.cloudApiKey) {
    callbacks.onError("Cloud mode requires an API key. Set it in Runtime Settings.");
    return;
  }

  const messages = (Array.isArray(body.messages) ? body.messages : []) as ChatMessage[];
  const input = messages.map((m) => ({ role: m.role, content: [{ type: "input_text", text: m.content }] }));

  const baseUrl = trimTrailingSlash(cfg.cloudBaseUrl);

  const res = await fetch(`${baseUrl}/responses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cfg.cloudApiKey}`,
    },
    body: JSON.stringify({
      model: cfg.cloudModel,
      input,
      stream: true,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    callbacks.onError(errorText || `Cloud error ${res.status}`);
    return;
  }

  const reader = res.body?.getReader();
  if (!reader) {
    callbacks.onError("Cloud response stream unavailable");
    return;
  }

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
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
          const json = JSON.parse(payload) as {
            type?: string;
            delta?: string;
          };

          if (json.type === "response.output_text.delta" && json.delta) {
            callbacks.onChunk(json.delta);
          }
        } catch {
          // Ignore malformed chunks and continue parsing stream.
        }
      }
    }
  }

  callbacks.onDone();
}

export async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<{ data: T | null; error: string | null }> {
  const cfg = getProviderConfig();

  try {
    if (cfg.mode === "cloud") {
      return {
        data: null,
        error: endpointSupportsCloud(endpoint)
          ? "Use chat for cloud mode streaming requests."
          : `Endpoint ${endpoint} is only available in local mode.`,
      };
    }

    const baseUrl = trimTrailingSlash(cfg.localBaseUrl);

    const res = await fetch(`${baseUrl}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
    });

    if (!res.ok) {
      const errorText = await res.text();
      return { data: null, error: errorText || `Error ${res.status}` };
    }

    const data = (await res.json()) as T;
    return { data, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}

export async function apiStream(
  endpoint: string,
  body: Record<string, unknown>,
  callbacks: StreamCallbacks
): Promise<void> {
  const cfg = getProviderConfig();

  try {
    if (cfg.mode === "cloud") {
      if (!endpointSupportsCloud(endpoint)) {
        callbacks.onError(`Endpoint ${endpoint} is only available in local mode.`);
        return;
      }

      await streamCloudChat(body, callbacks);
      return;
    }

    await streamLocal(endpoint, body, callbacks);
  } catch (err) {
    callbacks.onError(err instanceof Error ? err.message : "Stream error");
  }
}
