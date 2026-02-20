import { type ReactNode } from "react";
import Navbar from "@/components/Navbar";

/**
 * Shell layout for authenticated dashboard pages.
 * Provides the page background, text colour, and shared Navbar.
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[color:var(--background)] text-[color:var(--foreground)]">
      <Navbar />
      {children}
    </div>
  );
}
