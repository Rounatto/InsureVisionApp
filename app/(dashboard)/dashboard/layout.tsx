import type { ReactNode } from "react";
import Sidebar from "./components/Sidebar";
import { LanguageProvider } from "@/contexts/LanguageContext";

/**
 * Layout for all /dashboard/* routes.
 * Provides a persistent left sidebar with navigation and a scrollable content area.
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    // LanguageProvider wraps the entire dashboard area so every nested route
    // (home, history, profile, settings, sidebar, etc.) can read/update language.
    <LanguageProvider>
      <div className="min-h-screen bg-[color:var(--background)] text-[color:var(--foreground)]">
        <Sidebar />
        <main className="min-h-screen pt-24 lg:pl-64 lg:pt-0">{children}</main>
      </div>
    </LanguageProvider>
  );
}
