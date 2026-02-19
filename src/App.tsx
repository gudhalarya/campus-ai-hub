import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import Index from "./pages/Index";
import Workspace from "./pages/Workspace";
import UtilityBuilder from "./pages/UtilityBuilder";
import ResponsibleAI from "./pages/ResponsibleAI";
import RuntimeSettings from "./pages/RuntimeSettings";
import AppearanceStudio from "./pages/AppearanceStudio";
import NotFound from "./pages/NotFound";
import { UiConfigProvider } from "@/components/UiConfigProvider";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <UiConfigProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route element={<AppLayout />}>
              <Route path="/workspace" element={<Workspace />} />
              <Route path="/utility-builder" element={<UtilityBuilder />} />
              <Route path="/responsible-ai" element={<ResponsibleAI />} />
              <Route path="/runtime-settings" element={<RuntimeSettings />} />
              <Route path="/appearance" element={<AppearanceStudio />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </UiConfigProvider>
  </QueryClientProvider>
);

export default App;
