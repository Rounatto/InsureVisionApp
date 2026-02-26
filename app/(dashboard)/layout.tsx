import type { ReactNode } from "react";

/**
 * Route group layout for authenticated routes.
 * This is just a wrapper - actual dashboard layout is in /dashboard/layout.tsx
 */
export default function DashboardGroupLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
