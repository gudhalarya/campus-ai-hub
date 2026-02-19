import { Link } from "react-router-dom";
import {
  Cpu,
  Wifi,
  Shield,
  Zap,
  Lock,
  Users,
  ArrowRight,
  Bot,
} from "lucide-react";

const features = [
  {
    icon: Wifi,
    title: "LAN-First Architecture",
    desc: "Runs entirely on your campus network. No internet required.",
  },
  {
    icon: Lock,
    title: "Complete Privacy",
    desc: "Your prompts and data stay on-premise. Zero data collection.",
  },
  {
    icon: Zap,
    title: "Instant Responses",
    desc: "Local inference means low latency. No cloud round-trips.",
  },
  {
    icon: Cpu,
    title: "Open-Source Models",
    desc: "Transparent, auditable, and free open-source LLMs.",
  },
  {
    icon: Users,
    title: "Multi-User Ready",
    desc: "Concurrent student access with fair queuing.",
  },
  {
    icon: Shield,
    title: "Responsible AI",
    desc: "Built-in bias detection and usage transparency.",
  },
];

export default function Index() {
  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
        <div className="relative max-w-5xl mx-auto px-6 pt-20 pb-24 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground mb-8 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse-glow" />
            Offline-First • LAN-Based • Open Source
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 animate-slide-up">
            Campus AI Node
            <br />
            <span className="gradient-text">Free AI for Every Student</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: "0.1s" }}>
            Access a locally hosted open-source AI model directly from your campus network.
            No accounts, no costs, no data leaving your institution.
          </p>
          <div className="flex items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <Link
              to="/workspace"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity"
            >
              Open AI Workspace <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/utility-builder"
              className="inline-flex items-center gap-2 border border-border bg-card text-foreground px-6 py-3 rounded-lg font-medium text-sm hover:bg-secondary transition-colors"
            >
              Explore Tools
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold mb-3">Built for Campus Infrastructure</h2>
          <p className="text-muted-foreground">Everything runs on your local network.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => (
            <div key={f.title} className="group rounded-xl border border-border bg-card p-6 hover:border-primary/30 hover:glow-border transition-all duration-300">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <f.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-card/50">
        <div className="max-w-5xl mx-auto px-6 py-20 text-center">
          <h2 className="text-2xl font-bold mb-3">How It Works</h2>
          <p className="text-muted-foreground mb-10 max-w-xl mx-auto">Three steps from browser to AI.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-4">
            {[
              { step: "01", label: "Connect to Campus WiFi" },
              { step: "02", label: "Open AI Workspace" },
              { step: "03", label: "Start Prompting" },
            ].map((s, i) => (
              <div key={s.step} className="flex items-center gap-4">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full border-2 border-primary/30 flex items-center justify-center">
                    <span className="text-sm font-mono font-bold text-primary">{s.step}</span>
                  </div>
                  <span className="text-sm font-medium">{s.label}</span>
                </div>
                {i < 2 && <ArrowRight className="w-4 h-4 text-muted-foreground hidden sm:block" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="max-w-5xl mx-auto px-6 py-8 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Bot className="w-4 h-4" /> Campus AI Node
          </div>
          <span className="text-xs text-muted-foreground">Open Source • On-Premise • Private</span>
        </div>
      </footer>
    </div>
  );
}
