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
  Sparkles,
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

const steps = [
  { step: "01", label: "Connect to Campus WiFi", desc: "Join your institution's local network" },
  { step: "02", label: "Open AI Workspace", desc: "Launch the browser-based interface" },
  { step: "03", label: "Start Prompting", desc: "Chat, build tools, analyze content" },
];

export default function Index() {
  return (
    <div className="min-h-screen overflow-hidden">
      {/* Hero */}
      <section className="relative">
        {/* Animated background orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl animate-float" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-primary/3 blur-3xl animate-float" style={{ animationDelay: "1.5s" }} />
        </div>

        <div className="relative max-w-5xl mx-auto px-6 pt-24 pb-28 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 backdrop-blur-sm px-4 py-1.5 text-xs font-medium text-muted-foreground mb-8 opacity-0 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse-glow" />
            Offline-First • LAN-Based • Open Source
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 opacity-0 animate-blur-in" style={{ animationDelay: "0.15s" }}>
            Campus AI Node
            <br />
            <span className="gradient-text">Free AI for Every Student</span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 opacity-0 animate-slide-up" style={{ animationDelay: "0.3s" }}>
            Access a locally hosted open-source AI model directly from your campus network.
            No accounts, no costs, no data leaving your institution.
          </p>

          <div className="flex items-center justify-center gap-4 opacity-0 animate-slide-up" style={{ animationDelay: "0.45s" }}>
            <Link
              to="/workspace"
              className="group inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium text-sm hover:opacity-90 transition-all duration-300 hover:shadow-lg hover:shadow-primary/25 hover-scale"
            >
              <Sparkles className="w-4 h-4 transition-transform duration-300 group-hover:rotate-12" />
              Open AI Workspace
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <Link
              to="/utility-builder"
              className="inline-flex items-center gap-2 border border-border bg-card text-foreground px-6 py-3 rounded-lg font-medium text-sm hover:bg-secondary transition-all duration-300 hover-scale"
            >
              Explore Tools
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 pb-28">
        <div className="text-center mb-14 opacity-0 animate-fade-in" style={{ animationDelay: "0.5s" }}>
          <h2 className="text-2xl font-bold mb-3">Built for Campus Infrastructure</h2>
          <p className="text-muted-foreground">Everything runs on your local network.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="group rounded-xl border border-border bg-card p-6 hover:border-primary/30 transition-all duration-500 hover-lift opacity-0 animate-stagger-in"
              style={{ animationDelay: `${0.55 + i * 0.08}s` }}
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-all duration-300 group-hover:scale-110">
                <f.icon className="w-5 h-5 text-primary transition-transform duration-300 group-hover:scale-110" />
              </div>
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-border bg-card/50">
        <div className="max-w-5xl mx-auto px-6 py-24 text-center">
          <h2 className="text-2xl font-bold mb-3 opacity-0 animate-fade-in" style={{ animationDelay: "0.1s" }}>How It Works</h2>
          <p className="text-muted-foreground mb-14 max-w-xl mx-auto opacity-0 animate-fade-in" style={{ animationDelay: "0.2s" }}>Three steps from browser to AI.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-6">
            {steps.map((s, i) => (
              <div key={s.step} className="flex items-center gap-6">
                <div className="flex flex-col items-center gap-3 opacity-0 animate-stagger-in" style={{ animationDelay: `${0.3 + i * 0.15}s` }}>
                  <div className="w-14 h-14 rounded-full border-2 border-primary/30 flex items-center justify-center transition-all duration-500 hover:border-primary hover:glow-border hover-scale">
                    <span className="text-sm font-mono font-bold text-primary">{s.step}</span>
                  </div>
                  <span className="text-sm font-medium">{s.label}</span>
                  <span className="text-xs text-muted-foreground">{s.desc}</span>
                </div>
                {i < 2 && (
                  <div className="hidden sm:flex items-center opacity-0 animate-fade-in" style={{ animationDelay: `${0.5 + i * 0.15}s` }}>
                    <div className="w-12 h-px bg-gradient-to-r from-primary/40 to-primary/10" />
                    <ArrowRight className="w-4 h-4 text-primary/40" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="max-w-5xl mx-auto px-6 py-8 flex items-center justify-between opacity-0 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Bot className="w-4 h-4" /> Campus AI Node
          </div>
          <span className="text-xs text-muted-foreground">Open Source • On-Premise • Private</span>
        </div>
      </footer>
    </div>
  );
}
