import type { ReactNode } from "react";
import DashboardLayout from "@/components/DashboardLayout";

/**
 * Shared layout for all authenticated dashboard routes.
 * Wraps every child page with the DashboardLayout shell (Navbar + background).
 */
export default function DashboardGroupLayout({ children }: { children: ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
