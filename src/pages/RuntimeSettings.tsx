import { FormEvent, useEffect, useState } from "react";
import { ServerCog, Cloud, CheckCircle2, AlertCircle } from "lucide-react";
import {
  ProviderConfig,
  getDefaultProviderConfig,
  getProviderConfig,
  setProviderConfig,
} from "@/lib/provider-config";

export default function RuntimeSettings() {
  const [config, setConfig] = useState<ProviderConfig>(getProviderConfig());
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    const onUpdate = () => setConfig(getProviderConfig());
    window.addEventListener("provider-config-updated", onUpdate);
    window.addEventListener("storage", onUpdate);

    return () => {
      window.removeEventListener("provider-config-updated", onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, []);

  const onSave = (e: FormEvent) => {
    e.preventDefault();
    setProviderConfig(config);
    setSavedMessage("Runtime configuration saved.");

    window.setTimeout(() => setSavedMessage(null), 2500);
  };

  const onReset = () => {
    const defaults = getDefaultProviderConfig();
    setConfig(defaults);
    setProviderConfig(defaults);
    setSavedMessage("Reset to defaults.");

    window.setTimeout(() => setSavedMessage(null), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
          <ServerCog className="w-5 h-5 text-primary" />
          Runtime Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Run local mode for self-hosted inference, or cloud mode using an API key.
        </p>
      </div>

      <form onSubmit={onSave} className="space-y-5">
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <label className="text-sm font-medium block">Runtime Mode</label>
          <div className="grid sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setConfig((prev) => ({ ...prev, mode: "local" }))}
              className={`rounded-lg border px-4 py-3 text-left transition-colors ${
                config.mode === "local"
                  ? "border-primary bg-primary/10"
                  : "border-border hover:bg-secondary"
              }`}
            >
              <span className="font-medium text-sm flex items-center gap-2">
                <ServerCog className="w-4 h-4" /> Local Runtime
              </span>
              <p className="text-xs text-muted-foreground mt-1">
                Uses your local server/container (default for unlimited local usage).
              </p>
            </button>

            <button
              type="button"
              onClick={() => setConfig((prev) => ({ ...prev, mode: "cloud" }))}
              className={`rounded-lg border px-4 py-3 text-left transition-colors ${
                config.mode === "cloud"
                  ? "border-primary bg-primary/10"
                  : "border-border hover:bg-secondary"
              }`}
            >
              <span className="font-medium text-sm flex items-center gap-2">
                <Cloud className="w-4 h-4" /> Cloud API
              </span>
              <p className="text-xs text-muted-foreground mt-1">
                Uses API key + model for hosted inference.
              </p>
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <label className="text-sm font-medium block" htmlFor="localBaseUrl">
            Local Base URL
          </label>
          <input
            id="localBaseUrl"
            type="text"
            value={config.localBaseUrl}
            onChange={(e) => setConfig((prev) => ({ ...prev, localBaseUrl: e.target.value }))}
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
            placeholder="http://localhost:8000/api"
          />
        </div>

        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <label className="text-sm font-medium block" htmlFor="cloudBaseUrl">
            Cloud Base URL
          </label>
          <input
            id="cloudBaseUrl"
            type="text"
            value={config.cloudBaseUrl}
            onChange={(e) => setConfig((prev) => ({ ...prev, cloudBaseUrl: e.target.value }))}
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
            placeholder="https://api.openai.com/v1"
          />

          <label className="text-sm font-medium block" htmlFor="cloudModel">
            Cloud Model
          </label>
          <input
            id="cloudModel"
            type="text"
            value={config.cloudModel}
            onChange={(e) => setConfig((prev) => ({ ...prev, cloudModel: e.target.value }))}
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
            placeholder="gpt-4.1-mini"
          />

          <label className="text-sm font-medium block" htmlFor="cloudApiKey">
            Cloud API Key
          </label>
          <input
            id="cloudApiKey"
            type="password"
            value={config.cloudApiKey}
            onChange={(e) => setConfig((prev) => ({ ...prev, cloudApiKey: e.target.value }))}
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
            placeholder="sk-..."
          />
          <p className="text-xs text-muted-foreground">
            Key is saved in browser local storage on this machine.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm"
          >
            Save Settings
          </button>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm hover:bg-secondary"
          >
            Reset Defaults
          </button>
        </div>
      </form>

      {savedMessage && (
        <div className="mt-4 rounded-lg border border-border bg-card px-4 py-3 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-primary" />
          {savedMessage}
        </div>
      )}

      {config.mode === "cloud" && !config.cloudApiKey && (
        <div className="mt-4 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-warning mt-0.5" />
          Cloud mode is selected but no API key is set.
        </div>
      )}
    </div>
  );
}
