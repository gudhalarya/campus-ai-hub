import { PropsWithChildren, useEffect } from "react";
import { applyUiConfig, getUiConfig } from "@/lib/ui-config";

export function UiConfigProvider({ children }: PropsWithChildren) {
  useEffect(() => {
    const apply = () => applyUiConfig(getUiConfig());

    apply();

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystemTheme = () => apply();
    const onUpdate = () => apply();

    media.addEventListener("change", onSystemTheme);
    window.addEventListener("ui-config-updated", onUpdate);
    window.addEventListener("storage", onUpdate);

    return () => {
      media.removeEventListener("change", onSystemTheme);
      window.removeEventListener("ui-config-updated", onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, []);

  return <>{children}</>;
}
