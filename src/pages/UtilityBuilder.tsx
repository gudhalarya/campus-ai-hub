import { useState } from "react";
import { Wrench, FileText, HelpCircle, Calendar, Send, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { ErrorState } from "@/components/StateIndicators";

const templates = [
  { id: "resume", title: "Resume Tool", desc: "Generate or polish a professional resume", icon: FileText },
  { id: "faq", title: "FAQ Bot", desc: "Create an intelligent FAQ from your content", icon: HelpCircle },
  { id: "event", title: "Event Campaign Generator", desc: "Plan and generate event campaigns", icon: Calendar },
];

export default function UtilityBuilder() {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [output, setOutput] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    } else {
      setOutput(data?.result || "No output generated.");
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="mb-8 opacity-0 animate-fade-in">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Wrench className="w-4 h-4 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Utility Builder</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Select a template and describe what you need. The AI will generate it for you.
        </p>
      </div>

      {/* Templates */}
      <div className="grid sm:grid-cols-3 gap-3 mb-8">
        {templates.map((t, i) => (
          <button
            key={t.id}
            onClick={() => setSelectedTemplate(t.id === selectedTemplate ? null : t.id)}
            className={`text-left rounded-xl border p-4 transition-all duration-300 hover-lift opacity-0 animate-stagger-in ${
              selectedTemplate === t.id
                ? "border-primary bg-primary/5 glow-border"
                : "border-border bg-card hover:border-primary/30"
            }`}
            style={{ animationDelay: `${0.1 + i * 0.08}s` }}
          >
            <t.icon className={`w-5 h-5 mb-3 transition-all duration-300 ${selectedTemplate === t.id ? "text-primary scale-110" : "text-muted-foreground"}`} />
            <h3 className="font-medium text-sm mb-1">{t.title}</h3>
            <p className="text-xs text-muted-foreground">{t.desc}</p>
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input */}
        <div className="space-y-4 opacity-0 animate-fade-in" style={{ animationDelay: "0.35s" }}>
          <label className="text-sm font-medium">Prompt</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={
              selectedTemplate
                ? `Describe what you want the ${templates.find((t) => t.id === selectedTemplate)?.title} to create...`
                : "Select a template above, then describe your requirements..."
            }
            rows={8}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 resize-none placeholder:text-muted-foreground"
          />
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || loading}
            className="group inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 hover:opacity-90 hover:shadow-lg hover:shadow-primary/25 disabled:opacity-40 disabled:shadow-none hover-scale"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />}
            Generate
          </button>
        </div>

        {/* Output */}
        <div className="opacity-0 animate-fade-in" style={{ animationDelay: "0.45s" }}>
          <label className="text-sm font-medium mb-4 block">Output Preview</label>
          <div className="rounded-xl border border-border bg-card min-h-[240px] p-5 transition-all duration-500">
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
              <div className="flex flex-col items-center justify-center h-40 text-sm text-muted-foreground">
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mb-3">
                  <Wrench className="w-5 h-5 text-muted-foreground" />
                </div>
                Output will appear here after generation.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
