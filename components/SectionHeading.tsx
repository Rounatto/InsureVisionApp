import { type ReactNode } from "react";

/**
 * Uppercase section heading used on the profile page.
 */
export default function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-xs font-bold uppercase tracking-widest text-[color:var(--muted-foreground)] mb-6">
      {children}
    </h2>
  );
}
