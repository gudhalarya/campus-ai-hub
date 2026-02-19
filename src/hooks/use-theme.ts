import { useEffect, useState } from "react";
import { applyUiConfig, getUiConfig, setUiConfig } from "@/lib/ui-config";

function resolveDark(): boolean {
  const cfg = getUiConfig();
  if (cfg.themeMode === "dark") return true;
  if (cfg.themeMode === "light") return false;

  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function useTheme() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      return resolveDark();
    }
    return true;
  });

  useEffect(() => {
    const syncThemeState = () => setIsDark(resolveDark());
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    window.addEventListener("ui-config-updated", syncThemeState);
    media.addEventListener("change", syncThemeState);

    return () => {
      window.removeEventListener("ui-config-updated", syncThemeState);
      media.removeEventListener("change", syncThemeState);
    };
  }, []);

  useEffect(() => {
    const cfg = getUiConfig();
    cfg.themeMode = isDark ? "dark" : "light";
    setUiConfig(cfg);
    applyUiConfig(cfg);
  }, [isDark]);

  const toggle = () => setIsDark((prev) => !prev);

  return { isDark, toggle };
}
