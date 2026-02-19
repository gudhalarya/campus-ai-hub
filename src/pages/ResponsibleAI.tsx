import { useState, useEffect } from "react";
import { Shield, AlertTriangle, Eye, BarChart3, RefreshCw, Loader2, Info } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { LoadingState } from "@/components/StateIndicators";

interface AiReport {
  confidence: number;
  biasWarnings: string[];
  transparencyScore: number;
  modelInfo: string;
  lastQuery: string;
}

function AnimatedScoreBar({ value, max = 100, label }: { value: number; max?: number; label: string }) {
  const [animated, setAnimated] = useState(0);
  const pct = Math.round((value / max) * 100);

  useEffect(() => {
    const timeout = setTimeout(() => setAnimated(pct), 300);
    return () => clearTimeout(timeout);
  }, [pct]);

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm font-mono text-muted-foreground">{animated}%</span>
      </div>
      <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-1000 ease-out"
          style={{ width: `${animated}%` }}
        />
      </div>
    </div>
  );
}

export default function ResponsibleAI() {
  const [report, setReport] = useState<AiReport | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    const { data } = await apiFetch<AiReport>("/ai/report");
    setLoading(false);
    setReport(data);
  };

  useEffect(() => {
    fetchReport();
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8 opacity-0 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Shield className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Responsible AI</h1>
            <p className="text-sm text-muted-foreground">Transparency and accountability metrics</p>
          </div>
        </div>
        <button
          onClick={fetchReport}
          disabled={loading}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-all duration-300 hover-scale"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Refresh
        </button>
      </div>

      {loading ? (
        <LoadingState message="Fetching AI report..." />
      ) : !report ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {/* Empty state cards */}
          {[
            { icon: BarChart3, title: "Confidence Score", desc: "Model confidence data will appear here once connected to the backend." },
            { icon: Eye, title: "Transparency Score", desc: "AI transparency metrics will be displayed here." },
          ].map((card, i) => (
            <div
              key={card.title}
              className="rounded-xl border border-border bg-card p-6 opacity-0 animate-stagger-in"
              style={{ animationDelay: `${0.1 + i * 0.1}s` }}
            >
              <div className="flex items-center gap-2 mb-4">
                <card.icon className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm">{card.title}</h3>
              </div>
              <div className="h-2.5 rounded-full bg-secondary overflow-hidden mb-3">
                <div className="h-full rounded-full bg-muted w-0" />
              </div>
              <p className="text-xs text-muted-foreground">{card.desc}</p>
            </div>
          ))}

          <div className="rounded-xl border border-border bg-card p-6 sm:col-span-2 opacity-0 animate-stagger-in" style={{ animationDelay: "0.3s" }}>
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-4 h-4 text-warning" />
              <h3 className="font-semibold text-sm">Bias Warnings</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Bias detection results will appear here once the backend is connected at <code className="text-xs bg-secondary px-1.5 py-0.5 rounded">localhost:8000</code>.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 sm:col-span-2 opacity-0 animate-stagger-in" style={{ animationDelay: "0.4s" }}>
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-sm">Model Information</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Connect the Rust backend to view model details, parameters, and query history.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="rounded-xl border border-border bg-card p-6 opacity-0 animate-stagger-in hover-lift" style={{ animationDelay: "0.1s" }}>
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-sm">Confidence Score</h3>
            </div>
            <AnimatedScoreBar value={report.confidence * 100} label="Model Confidence" />
            <p className="text-xs text-muted-foreground mt-3">
              Based on the model's self-reported certainty for the last response.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 opacity-0 animate-stagger-in hover-lift" style={{ animationDelay: "0.2s" }}>
            <div className="flex items-center gap-2 mb-4">
              <Eye className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-sm">Transparency Score</h3>
            </div>
            <AnimatedScoreBar value={report.transparencyScore} label="AI Transparency" />
            <p className="text-xs text-muted-foreground mt-3">
              Measures how well the AI explains its reasoning process.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 sm:col-span-2 opacity-0 animate-stagger-in" style={{ animationDelay: "0.3s" }}>
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-4 h-4 text-warning" />
              <h3 className="font-semibold text-sm">Bias Warnings</h3>
            </div>
            {report.biasWarnings.length === 0 ? (
              <p className="text-sm text-muted-foreground">No bias warnings detected.</p>
            ) : (
              <ul className="space-y-2">
                {report.biasWarnings.map((w, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm bg-warning/5 border border-warning/20 rounded-lg px-4 py-3 opacity-0 animate-stagger-in"
                    style={{ animationDelay: `${0.4 + i * 0.1}s` }}
                  >
                    <AlertTriangle className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
                    {w}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card p-6 sm:col-span-2 opacity-0 animate-stagger-in hover-lift" style={{ animationDelay: "0.5s" }}>
            <h3 className="font-semibold text-sm mb-3">Model Information</h3>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Model</span>
                <p className="font-mono mt-1">{report.modelInfo}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Last Query</span>
                <p className="font-mono mt-1">{report.lastQuery}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
