import { useState } from "react";
import { Palette, SunMoon, Type, Minimize2, Circle, Sparkles, MousePointer2 } from "lucide-react";
import {
  ACCENT_VALUES,
  UiConfig,
  getDefaultUiConfig,
  getUiConfig,
  setUiConfig,
} from "@/lib/ui-config";

const accentLabels: Record<keyof typeof ACCENT_VALUES, string> = {
  teal: "Teal",
  blue: "Blue",
  orange: "Orange",
  crimson: "Crimson",
  emerald: "Emerald",
};

function previewColor(hslValue: string): string {
  return `hsl(${hslValue})`;
}

export default function AppearanceStudio() {
  const [config, setConfigState] = useState<UiConfig>(getUiConfig());

  const update = (next: UiConfig) => {
    setConfigState(next);
    setUiConfig(next);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
          <Palette className="w-5 h-5 text-primary" /> Appearance Studio
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Full frontend customization with live preview.
        </p>
      </div>

      <div className="grid gap-4 sm:gap-5">
        <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
          <h2 className="text-sm font-semibold flex items-center gap-2 mb-3">
            <SunMoon className="w-4 h-4 text-primary" /> Theme Mode
          </h2>
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              { key: "system", label: "System" },
              { key: "light", label: "Light" },
              { key: "dark", label: "Dark" },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => update({ ...config, themeMode: item.key as UiConfig["themeMode"] })}
                className={`rounded-lg border px-4 py-2.5 text-sm transition-colors ${
                  config.themeMode === item.key ? "border-primary bg-primary/10" : "border-border hover:bg-secondary"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
          <h2 className="text-sm font-semibold flex items-center gap-2 mb-3">
            <Circle className="w-4 h-4 text-primary" /> Accent Color
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {(Object.keys(ACCENT_VALUES) as Array<keyof typeof ACCENT_VALUES>).map((key) => {
              const active = config.accent === key;
              return (
                <button
                  key={key}
                  onClick={() => update({ ...config, accent: key })}
                  className={`rounded-lg border px-3 py-2.5 text-xs sm:text-sm transition-colors ${
                    active ? "border-primary bg-primary/10" : "border-border hover:bg-secondary"
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="inline-block w-3.5 h-3.5 rounded-full"
                      style={{ backgroundColor: previewColor(ACCENT_VALUES[key]) }}
                    />
                    {accentLabels[key]}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-4 sm:p-5 grid sm:grid-cols-3 gap-4">
          <div>
            <h2 className="text-sm font-semibold flex items-center gap-2 mb-2">
              <Type className="w-4 h-4 text-primary" /> Font Size
            </h2>
            <select
              value={config.fontScale}
              onChange={(e) => update({ ...config, fontScale: e.target.value as UiConfig["fontScale"] })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="sm">Small</option>
              <option value="md">Medium</option>
              <option value="lg">Large</option>
            </select>
          </div>

          <div>
            <h2 className="text-sm font-semibold flex items-center gap-2 mb-2">
              <Minimize2 className="w-4 h-4 text-primary" /> Density
            </h2>
            <select
              value={config.density}
              onChange={(e) => update({ ...config, density: e.target.value as UiConfig["density"] })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="compact">Compact</option>
              <option value="comfortable">Comfortable</option>
              <option value="spacious">Spacious</option>
            </select>
          </div>

          <div>
            <h2 className="text-sm font-semibold flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-primary" /> Corner Radius
            </h2>
            <input
              type="range"
              min={0.25}
              max={1.2}
              step={0.05}
              value={config.radius}
              onChange={(e) => update({ ...config, radius: Number(e.target.value) })}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground mt-1">{config.radius.toFixed(2)}rem</p>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-4 sm:p-5 grid sm:grid-cols-2 gap-4">
          <button
            onClick={() => update({ ...config, motion: config.motion === "full" ? "reduced" : "full" })}
            className="rounded-lg border border-border px-4 py-3 text-left hover:bg-secondary transition-colors"
          >
            <p className="text-sm font-medium">Motion</p>
            <p className="text-xs text-muted-foreground mt-1">
              {config.motion === "full" ? "Full animations enabled" : "Reduced motion enabled"}
            </p>
          </button>

          <button
            onClick={() => update({ ...config, cursorAura: !config.cursorAura })}
            className="rounded-lg border border-border px-4 py-3 text-left hover:bg-secondary transition-colors"
          >
            <p className="text-sm font-medium flex items-center gap-2">
              <MousePointer2 className="w-4 h-4" /> Cursor Aura
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {config.cursorAura ? "Custom cursor effects enabled" : "Default cursor mode enabled"}
            </p>
          </button>
        </section>

        <div>
          <button
            onClick={() => {
              const defaults = getDefaultUiConfig();
              update(defaults);
            }}
            className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-secondary transition-colors"
          >
            Reset Appearance Defaults
          </button>
        </div>
      </div>
    </div>
  );
}
