import type { ReactNode } from "react";
import Sidebar from "./components/Sidebar";

/**
 * Layout for all /dashboard/* routes.
 * Provides a persistent left sidebar with navigation and a scrollable content area.
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[color:var(--background)] text-[color:var(--foreground)]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
