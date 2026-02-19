import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import {
  MessageSquare,
  Wrench,
  Shield,
  Bot,
  ChevronLeft,
  Home,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { title: "Home", path: "/", icon: Home },
  { title: "AI Workspace", path: "/workspace", icon: MessageSquare },
  { title: "Utility Builder", path: "/utility-builder", icon: Wrench },
  { title: "Responsible AI", path: "/responsible-ai", icon: Shield },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside
      className={cn(
        "hidden md:flex h-screen sticky top-0 flex-col border-r border-border bg-card/80 backdrop-blur-xl transition-all duration-300 ease-out",
        collapsed ? "w-16" : "w-60"
      )}
    >
      <div className="flex items-center gap-2 px-4 h-14 border-b border-border">
        <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center flex-shrink-0 transition-transform duration-300 hover:scale-110">
          <Bot className="w-4 h-4 text-primary-foreground" />
        </div>
        <span
          className={cn(
            "font-semibold text-sm truncate transition-all duration-300",
            collapsed ? "opacity-0 w-0" : "opacity-100 w-auto"
          )}
        >
          Campus AI Node
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all duration-200 group relative",
              isActive(item.path)
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            <item.icon
              className={cn(
                "w-4 h-4 flex-shrink-0 transition-transform duration-200",
                isActive(item.path) && "scale-110"
              )}
            />
            <span
              className={cn(
                "transition-all duration-300",
                collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
              )}
            >
              {item.title}
            </span>
            {isActive(item.path) && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r-full" />
            )}
          </Link>
        ))}
      </nav>

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center h-10 border-t border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200"
      >
        <ChevronLeft
          className={cn(
            "w-4 h-4 transition-transform duration-300",
            collapsed && "rotate-180"
          )}
        />
      </button>
    </aside>
  );
}
