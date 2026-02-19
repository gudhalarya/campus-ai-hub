export type ProviderMode = "local" | "cloud";

export interface ProviderConfig {
  mode: ProviderMode;
  localBaseUrl: string;
  cloudBaseUrl: string;
  cloudApiKey: string;
  cloudModel: string;
}

const STORAGE_KEY = "campus-ai-provider-config";

const DEFAULT_CONFIG: ProviderConfig = {
  mode: "local",
  localBaseUrl: "http://localhost:8000/api",
  cloudBaseUrl: import.meta.env.VITE_OPENAI_BASE_URL || "https://api.openai.com/v1",
  cloudApiKey: import.meta.env.VITE_OPENAI_API_KEY || "",
  cloudModel: import.meta.env.VITE_OPENAI_MODEL || "gpt-4.1-mini",
};

function parseConfig(raw: string | null): ProviderConfig | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<ProviderConfig>;
    if (!parsed || (parsed.mode !== "local" && parsed.mode !== "cloud")) {
      return null;
    }

    return {
      mode: parsed.mode,
      localBaseUrl: parsed.localBaseUrl || DEFAULT_CONFIG.localBaseUrl,
      cloudBaseUrl: parsed.cloudBaseUrl || DEFAULT_CONFIG.cloudBaseUrl,
      cloudApiKey: parsed.cloudApiKey || DEFAULT_CONFIG.cloudApiKey,
      cloudModel: parsed.cloudModel || DEFAULT_CONFIG.cloudModel,
    };
  } catch {
    return null;
  }
}

export function getProviderConfig(): ProviderConfig {
  if (typeof window === "undefined") {
    return DEFAULT_CONFIG;
  }

  const parsed = parseConfig(window.localStorage.getItem(STORAGE_KEY));
  return parsed || DEFAULT_CONFIG;
}

export function setProviderConfig(nextConfig: ProviderConfig): void {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextConfig));
  window.dispatchEvent(new Event("provider-config-updated"));
}

export function getDefaultProviderConfig(): ProviderConfig {
  return DEFAULT_CONFIG;
}
