export type ThemeMode = "light" | "dark" | "system";
export type FontScale = "sm" | "md" | "lg";
export type Density = "compact" | "comfortable" | "spacious";
export type MotionMode = "full" | "reduced";

export type AccentPreset = "teal" | "blue" | "orange" | "crimson" | "emerald";

export interface UiConfig {
  themeMode: ThemeMode;
  accent: AccentPreset;
  fontScale: FontScale;
  density: Density;
  radius: number;
  motion: MotionMode;
  cursorAura: boolean;
}

const STORAGE_KEY = "campus-ai-ui-config";

export const ACCENT_VALUES: Record<AccentPreset, string> = {
  teal: "173 80% 40%",
  blue: "217 91% 60%",
  orange: "27 96% 52%",
  crimson: "347 77% 50%",
  emerald: "152 71% 39%",
};

const DEFAULT_UI_CONFIG: UiConfig = {
  themeMode: "system",
  accent: "teal",
  fontScale: "md",
  density: "comfortable",
  radius: 0.5,
  motion: "full",
  cursorAura: true,
};

function parseUiConfig(raw: string | null): UiConfig | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<UiConfig>;
    if (!parsed) return null;

    return {
      themeMode:
        parsed.themeMode === "light" || parsed.themeMode === "dark" || parsed.themeMode === "system"
          ? parsed.themeMode
          : DEFAULT_UI_CONFIG.themeMode,
      accent:
        parsed.accent && parsed.accent in ACCENT_VALUES
          ? (parsed.accent as AccentPreset)
          : DEFAULT_UI_CONFIG.accent,
      fontScale:
        parsed.fontScale === "sm" || parsed.fontScale === "md" || parsed.fontScale === "lg"
          ? parsed.fontScale
          : DEFAULT_UI_CONFIG.fontScale,
      density:
        parsed.density === "compact" || parsed.density === "comfortable" || parsed.density === "spacious"
          ? parsed.density
          : DEFAULT_UI_CONFIG.density,
      radius: typeof parsed.radius === "number" ? Math.min(1.2, Math.max(0.25, parsed.radius)) : DEFAULT_UI_CONFIG.radius,
      motion: parsed.motion === "reduced" ? "reduced" : "full",
      cursorAura: typeof parsed.cursorAura === "boolean" ? parsed.cursorAura : DEFAULT_UI_CONFIG.cursorAura,
    };
  } catch {
    return null;
  }
}

export function getDefaultUiConfig(): UiConfig {
  return DEFAULT_UI_CONFIG;
}

export function getUiConfig(): UiConfig {
  if (typeof window === "undefined") return DEFAULT_UI_CONFIG;

  const parsed = parseUiConfig(window.localStorage.getItem(STORAGE_KEY));
  return parsed || DEFAULT_UI_CONFIG;
}

export function setUiConfig(next: UiConfig): void {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("ui-config-updated"));
}

function isDarkMode(themeMode: ThemeMode): boolean {
  if (themeMode === "dark") return true;
  if (themeMode === "light") return false;

  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function applyUiConfig(config: UiConfig): void {
  if (typeof window === "undefined") return;

  const root = document.documentElement;

  if (isDarkMode(config.themeMode)) {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }

  const accent = ACCENT_VALUES[config.accent];
  root.style.setProperty("--primary", accent);
  root.style.setProperty("--accent", accent);
  root.style.setProperty("--ring", accent);
  root.style.setProperty("--glow", accent);
  root.style.setProperty("--sidebar-primary", accent);

  const fontPx = config.fontScale === "sm" ? "15px" : config.fontScale === "lg" ? "17px" : "16px";
  root.style.fontSize = fontPx;

  root.style.setProperty("--radius", `${config.radius}rem`);

  root.dataset.density = config.density;
  root.dataset.motion = config.motion;
  root.dataset.cursor = config.cursorAura ? "on" : "off";
}
