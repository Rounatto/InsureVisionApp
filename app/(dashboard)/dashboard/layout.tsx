"use client";

import { useState, useCallback } from "react";
import type { ReactNode } from "react";
import Sidebar from "./components/Sidebar";
import { LanguageProvider } from "@/contexts/LanguageContext";

/**
 * Layout for all /dashboard/* routes.
 * Provides a persistent left sidebar with navigation and a scrollable content area.
 * On mobile, the sidebar is hidden behind a hamburger toggle.
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  return (
    <LanguageProvider>
      <div className="flex min-h-screen bg-[color:var(--background)] text-[color:var(--foreground)]">
        {/* Mobile hamburger button */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="md:hidden fixed top-4 left-4 z-30 flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--card)] border border-[color:var(--border)] shadow-lg hover:bg-[color:var(--muted)] transition-colors"
          aria-label="Open sidebar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5 text-[color:var(--foreground)]">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>

        <Sidebar open={sidebarOpen} onClose={closeSidebar} />
        <main className="flex-1 min-w-0 overflow-y-auto">{children}</main>
      </div>
    </LanguageProvider>
  );
}
