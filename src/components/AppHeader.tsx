import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";

export function AppHeader() {
  const { isDark, toggle } = useTheme();

  return (
    <header className="h-14 border-b border-border bg-card/80 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono text-muted-foreground">
          LAN • <span className="text-primary">Connected</span>
        </span>
      </div>
      <button
        onClick={toggle}
        className="p-2 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Toggle theme"
      >
        {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>
    </header>
  );
}
