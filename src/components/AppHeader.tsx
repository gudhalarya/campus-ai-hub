import { Link, useLocation } from "react-router-dom";
import { Sun, Moon, Menu } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { getProviderConfig } from "@/lib/provider-config";
import { useEffect, useState } from "react";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const navItems = [
  { title: "Home", path: "/" },
  { title: "AI Workspace", path: "/workspace" },
  { title: "Utility Builder", path: "/utility-builder" },
  { title: "Responsible AI", path: "/responsible-ai" },
  { title: "Appearance", path: "/appearance" },
  { title: "Runtime Settings", path: "/runtime-settings" },
];

export function AppHeader() {
  const { isDark, toggle } = useTheme();
  const location = useLocation();
  const [mode, setMode] = useState(getProviderConfig().mode);

  useEffect(() => {
    const updateMode = () => setMode(getProviderConfig().mode);
    window.addEventListener("provider-config-updated", updateMode);
    window.addEventListener("storage", updateMode);

    return () => {
      window.removeEventListener("provider-config-updated", updateMode);
      window.removeEventListener("storage", updateMode);
    };
  }, []);

  return (
    <header className="h-14 border-b border-border bg-card/80 backdrop-blur-xl flex items-center justify-between px-3 sm:px-6 sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <Sheet>
          <SheetTrigger asChild>
            <button
              className="md:hidden p-2 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Open navigation menu"
            >
              <Menu className="w-4 h-4" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[82%] max-w-[320px]">
            <div className="h-14 border-b border-border px-4 flex items-center gap-2">
              <img src="/aethercampus-mark.svg" alt="AetherCampus logo" className="w-7 h-7 rounded-md" />
              <SheetTitle className="text-sm">AetherCampus</SheetTitle>
            </div>
            <nav className="p-2 space-y-1">
              {navItems.map((item) => {
                const active = location.pathname === item.path;
                return (
                  <SheetClose asChild key={item.path}>
                    <Link
                      to={item.path}
                      className={`block rounded-md px-3 py-2 text-sm transition-colors ${
                        active
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                      }`}
                    >
                      {item.title}
                    </Link>
                  </SheetClose>
                );
              })}
            </nav>
          </SheetContent>
        </Sheet>
        <Link to="/" className="hidden md:flex items-center gap-2 ml-1">
          <img src="/aethercampus-mark.svg" alt="AetherCampus logo" className="w-6 h-6 rounded-md" />
          <span className="text-sm font-semibold">AetherCampus</span>
        </Link>
        <span className="text-[11px] sm:text-xs font-mono text-muted-foreground">
          {mode === "local" ? "LOCAL" : "CLOUD"} •{" "}
          <span className="text-primary">{mode === "local" ? "Connected" : "API"}</span>
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
