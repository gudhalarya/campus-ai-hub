import { useState, useEffect } from "react";
import { Shield, AlertTriangle, Eye, BarChart3, RefreshCw, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface AiReport {
  confidence: number;
  biasWarnings: string[];
  transparencyScore: number;
  modelInfo: string;
  lastQuery: string;
}

const mockReport: AiReport = {
  confidence: 0.87,
  biasWarnings: [
    "Potential gender bias detected in resume analysis output",
    "Limited training data for non-English queries",
  ],
  transparencyScore: 92,
  modelInfo: "Open-source LLM v2.1 • 7B parameters • Quantized INT8",
  lastQuery: "Generate a professional summary for a software engineer",
};

function ScoreBar({ value, max = 100, label }: { value: number; max?: number; label: string }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm font-mono text-muted-foreground">{pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-secondary overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function ResponsibleAI() {
  const [report, setReport] = useState<AiReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await apiFetch<AiReport>("/ai/report");
    setLoading(false);

    if (err) {
      // Use mock data as fallback during dev
      setReport(mockReport);
    } else {
      setReport(data);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
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
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Refresh
        </button>
      </div>

      {report && (
        <div className="grid sm:grid-cols-2 gap-4">
          {/* Confidence */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-sm">Confidence Score</h3>
            </div>
            <ScoreBar value={report.confidence * 100} label="Model Confidence" />
            <p className="text-xs text-muted-foreground mt-3">
              Based on the model's self-reported certainty for the last response.
            </p>
          </div>

          {/* Transparency */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Eye className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-sm">Transparency Score</h3>
            </div>
            <ScoreBar value={report.transparencyScore} label="AI Transparency" />
            <p className="text-xs text-muted-foreground mt-3">
              Measures how well the AI explains its reasoning process.
            </p>
          </div>

          {/* Bias Warnings */}
          <div className="rounded-xl border border-border bg-card p-6 sm:col-span-2">
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
                    className="flex items-start gap-2 text-sm bg-warning/5 border border-warning/20 rounded-lg px-4 py-3"
                  >
                    <AlertTriangle className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
                    {w}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Model Info */}
          <div className="rounded-xl border border-border bg-card p-6 sm:col-span-2">
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
