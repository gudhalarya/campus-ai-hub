import { type CSSProperties, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Cpu,
  Gauge,
  Lock,
  Network,
  Server,
  Shield,
  Sparkles,
  Zap,
} from "lucide-react";

const capabilityCards = [
  {
    icon: Server,
    title: "Local Runtime First",
    description: "Run your own model stack on campus hardware with predictable cost and privacy.",
  },
  {
    icon: Network,
    title: "Hybrid Switching",
    description: "Switch to cloud API mode instantly when needed, without changing user workflows.",
  },
  {
    icon: Shield,
    title: "Responsible Controls",
    description: "Audit signals, policy boundaries, and transparency metrics stay visible to admins.",
  },
  {
    icon: Gauge,
    title: "Speed Focused",
    description: "Backend-ready architecture for high-throughput inference and streaming responses.",
  },
];

const rollout = [
  {
    title: "Install Local Stack",
    description: "Bring up runtime containers and API in your own environment.",
  },
  {
    title: "Customize Experience",
    description: "Brand and theme the interface for student and faculty use-cases.",
  },
  {
    title: "Launch Workspace",
    description: "Use the final CTA to enter the chat workspace with real-time streaming.",
  },
];

const trustPoints = [
  "Prompt data stays in your own infrastructure in local mode",
  "Cloud fallback is optional and controlled with API-key settings",
  "No lock-in: frontend can target any compatible backend",
  "Built for fast demos now and production hardening after hackathon",
];

function TopNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/aethercampus-mark.svg" alt="AetherCampus logo" className="w-8 h-8 rounded-md" />
          <span className="text-sm font-semibold tracking-wide">AetherCampus</span>
        </div>

        <nav className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
          <a href="#capabilities" className="hover:text-foreground transition-colors">
            Capabilities
          </a>
          <a href="#roadmap" className="hover:text-foreground transition-colors">
            Roadmap
          </a>
          <a href="#trust" className="hover:text-foreground transition-colors">
            Trust
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/appearance"
            className="hidden sm:inline-flex items-center text-sm border border-border px-3.5 py-2 rounded-md hover:bg-secondary transition-colors"
          >
            Customize UI
          </Link>
          <Link
            to="/workspace"
            className="inline-flex items-center gap-2 text-sm bg-primary text-primary-foreground px-3.5 py-2 rounded-md hover:opacity-90 transition-opacity"
          >
            Open Workspace <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border/60">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 right-0 w-[34rem] h-[34rem] rounded-full blur-3xl bg-primary/10" />
        <div className="absolute bottom-[-10rem] left-[-7rem] w-[28rem] h-[28rem] rounded-full blur-3xl bg-warning/10" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 grid lg:grid-cols-2 gap-10 items-center">
        <div className="reveal-left" data-reveal>
          <img
            src="/aethercampus-wordmark.svg"
            alt="AetherCampus"
            className="h-12 sm:h-14 w-auto mb-5"
          />
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground mb-5">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            Local-first AI Platform for Campus Teams
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight hero-shimmer">
            A real product website,
            <span className="block gradient-text">then one click into chat.</span>
          </h1>

          <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-xl leading-relaxed">
            Introduce the platform with clarity, show security and performance value, and guide users to a final call to action that opens the live AI workspace.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <a
              href="#final-cta"
              className="inline-flex justify-center items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Start Your AI Session
              <ArrowRight className="w-4 h-4" />
            </a>
            <Link
              to="/runtime-settings"
              className="inline-flex justify-center items-center gap-2 rounded-lg border border-border px-5 py-3 text-sm font-medium hover:bg-secondary transition-colors"
            >
              Runtime Settings
            </Link>
          </div>
        </div>

        <div className="rounded-2xl premium-card p-5 sm:p-6 reveal-right" data-reveal style={{ "--reveal-delay": "120ms" } as CSSProperties}>
          <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground mb-4">What You Get</div>
          <div className="space-y-3">
            <div className="rounded-lg border border-border bg-background px-4 py-3 text-sm flex items-start gap-3">
              <Cpu className="w-4 h-4 mt-0.5 text-primary" />
              Local model execution for high-volume usage
            </div>
            <div className="rounded-lg border border-border bg-background px-4 py-3 text-sm flex items-start gap-3">
              <Lock className="w-4 h-4 mt-0.5 text-primary" />
              Privacy-preserving deployment across institutions
            </div>
            <div className="rounded-lg border border-border bg-background px-4 py-3 text-sm flex items-start gap-3">
              <Zap className="w-4 h-4 mt-0.5 text-primary" />
              Streaming responses and production-ready UX
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Index() {
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (nodes.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -10% 0px" }
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground mesh-ambient">
      <TopNav />
      <Hero />

      <section id="capabilities" className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <div className="mb-8 sm:mb-10 reveal-up" data-reveal>
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Capabilities</p>
          <h2 className="text-2xl sm:text-3xl font-bold mt-2">Built like a serious product, not a plain demo</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-4 sm:gap-5">
          {capabilityCards.map((card, idx) => (
            <article
              key={card.title}
              className="rounded-xl premium-card p-5 sm:p-6 hover-lift elevate-hover reveal-up"
              data-reveal
              style={{ "--reveal-delay": `${idx * 80}ms` } as CSSProperties}
            >
              <div className="w-10 h-10 rounded-lg bg-primary/12 flex items-center justify-center mb-4 icon-pop">
                <card.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-base font-semibold">{card.title}</h3>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{card.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="roadmap" className="border-y border-border/60 bg-card/45">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <div className="reveal-up" data-reveal>
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Flow</p>
            <h2 className="text-2xl sm:text-3xl font-bold mt-2 mb-10">How users experience your platform</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-4 sm:gap-5">
            {rollout.map((item, idx) => (
              <div
                key={item.title}
                className="rounded-xl premium-card p-5 sm:p-6 reveal-up elevate-hover"
                data-reveal
                style={{ "--reveal-delay": `${idx * 110}ms` } as CSSProperties}
              >
                <div className="text-xs font-mono text-primary mb-3">STEP 0{idx + 1}</div>
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground mt-2">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="trust" className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <div className="reveal-up" data-reveal>
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Trust & Governance</p>
          <h2 className="text-2xl sm:text-3xl font-bold mt-2 mb-8">Clear controls for real deployments</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          {trustPoints.map((item, idx) => (
            <div
              key={item}
              className="rounded-lg premium-card px-4 py-3 text-sm flex items-start gap-2.5 reveal-up elevate-hover"
              data-reveal
              style={{ "--reveal-delay": `${idx * 65}ms` } as CSSProperties}
            >
              <CheckCircle2 className="w-4 h-4 text-primary mt-0.5" />
              {item}
            </div>
          ))}
        </div>
      </section>

      <section id="final-cta" className="border-t border-border/60 bg-card/55">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-20 text-center reveal-up" data-reveal>
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Final Step</p>
          <h2 className="text-3xl sm:text-4xl font-bold mt-3">Ready to start chatting?</h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
            You have seen the full introduction. Now jump into the live workspace and start your first prompt.
          </p>
          <div className="mt-8">
            <Link
              to="/workspace"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3.5 text-base font-medium text-primary-foreground hover:opacity-90 transition-all duration-300 hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5"
            >
              Go to AI Workspace
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60 bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 grid md:grid-cols-3 gap-8 text-left reveal-up" data-reveal>
          <div>
            <div className="flex items-center gap-2 mb-3">
              <img src="/aethercampus-mark.svg" alt="AetherCampus logo" className="w-7 h-7 rounded-md" />
              <span className="font-semibold text-sm">AetherCampus</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Local-first AI platform with optional cloud API mode for flexible rollout.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-3">Product</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p><Link to="/workspace" className="hover:text-foreground">Workspace</Link></p>
              <p><Link to="/utility-builder" className="hover:text-foreground">Utility Builder</Link></p>
              <p><Link to="/responsible-ai" className="hover:text-foreground">Responsible AI</Link></p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-3">System</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p><Link to="/runtime-settings" className="hover:text-foreground">Runtime Settings</Link></p>
              <p><Link to="/appearance" className="hover:text-foreground">Appearance Studio</Link></p>
              <p className="text-xs pt-2">Hackathon build track: 10-day ship mode</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
