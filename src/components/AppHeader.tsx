import { Link, useLocation } from "react-router-dom";
import { Sun, Moon, Menu, Bot } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const navItems = [
  { title: "Home", path: "/" },
  { title: "AI Workspace", path: "/workspace" },
  { title: "Utility Builder", path: "/utility-builder" },
  { title: "Responsible AI", path: "/responsible-ai" },
];

export function AppHeader() {
  const { isDark, toggle } = useTheme();
  const location = useLocation();

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
              <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
                <Bot className="w-4 h-4 text-primary-foreground" />
              </div>
              <SheetTitle className="text-sm">Campus AI Node</SheetTitle>
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
        <span className="text-[11px] sm:text-xs font-mono text-muted-foreground">
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
