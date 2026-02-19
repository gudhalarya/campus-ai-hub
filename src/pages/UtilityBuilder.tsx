import { useEffect, useState } from "react";
import { Wrench, Send, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { ErrorState } from "@/components/StateIndicators";

interface UtilityTemplate {
  id: string;
  title: string;
  description?: string;
}

export default function UtilityBuilder() {
  const [templates, setTemplates] = useState<UtilityTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templatesError, setTemplatesError] = useState<string | null>(null);

  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [output, setOutput] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTemplates = async () => {
    setTemplatesLoading(true);
    setTemplatesError(null);

    const { data, error: err } = await apiFetch<UtilityTemplate[]>("/utility/templates");

    setTemplatesLoading(false);

    if (err) {
      setTemplates([]);
      setTemplatesError(err);
      return;
    }

    const normalized = Array.isArray(data) ? data : [];
    setTemplates(normalized);

    if (normalized.length > 0) {
      setSelectedTemplate((prev) => (prev && normalized.some((t) => t.id === prev) ? prev : normalized[0].id));
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);
    setOutput(null);

    const { data, error: err } = await apiFetch<{ result: string }>("/utility/generate", {
      method: "POST",
      body: JSON.stringify({ template: selectedTemplate, prompt }),
    });

    setLoading(false);

    if (err) {
      setError(err);
      return;
    }

    setOutput(data?.result || "");
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="mb-6 sm:mb-8 opacity-0 animate-fade-in">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Wrench className="w-4 h-4 text-primary" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold">Utility Builder</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Pick a backend template and describe what you want to generate.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="space-y-4 opacity-0 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <label className="text-sm font-medium" htmlFor="template">
            Template
          </label>

          {templatesLoading ? (
            <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading templates...
            </div>
          ) : templatesError ? (
            <ErrorState message={templatesError} onRetry={loadTemplates} />
          ) : templates.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
              No templates found from backend.
            </div>
          ) : (
            <select
              id="template"
              value={selectedTemplate ?? ""}
              onChange={(e) => setSelectedTemplate(e.target.value || null)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
            >
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.title}
                </option>
              ))}
            </select>
          )}

          <label className="text-sm font-medium" htmlFor="prompt">
            Prompt
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the output you need..."
            rows={8}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 resize-none placeholder:text-muted-foreground"
          />
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || loading || templates.length === 0}
            className="group inline-flex w-full sm:w-auto justify-center items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 hover:opacity-90 hover:shadow-lg hover:shadow-primary/25 disabled:opacity-40 disabled:shadow-none hover-scale"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />}
            Generate
          </button>
        </div>

        <div className="opacity-0 animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <label className="text-sm font-medium mb-4 block">Output</label>
          <div className="rounded-xl border border-border bg-card min-h-[240px] p-4 sm:p-5 transition-all duration-500">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-40 gap-3 animate-fade-in">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Generating...</span>
              </div>
            ) : error ? (
              <div className="animate-scale-in">
                <ErrorState message={error} onRetry={handleGenerate} />
              </div>
            ) : output ? (
              <pre className="text-sm whitespace-pre-wrap font-mono leading-relaxed animate-fade-in">{output}</pre>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-sm text-muted-foreground text-center">
                Generated output will appear here.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
