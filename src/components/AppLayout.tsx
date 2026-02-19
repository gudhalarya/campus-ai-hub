import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { CursorAura } from "./CursorAura";

export function AppLayout() {
  return (
    <div className="relative flex min-h-screen w-full bg-background">
      <CursorAura />
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader />
        <main className="flex-1 overflow-auto app-main-surface">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
