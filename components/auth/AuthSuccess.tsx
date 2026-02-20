import { type ReactNode } from "react";
import Link from "next/link";

/**
 * Success / status state used after auth actions
 * (e.g. "Check your email", "Password reset!").
 */

interface AuthSuccessProps {
  /** Icon shown inside the green circle */
  icon: ReactNode;
  /** Main heading */
  title: string;
  /** Descriptive paragraph */
  description: string;
  /** Action rendered below the description (Link, button, etc.) */
  action?: ReactNode;
}

export default function AuthSuccess({
  icon,
  title,
  description,
  action,
}: AuthSuccessProps) {
  return (
    <div className="text-center">
      <div className="mb-6">
        <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
          {icon}
        </div>
        <h1 className="text-3xl font-bold text-[color:var(--foreground)] mb-2">{title}</h1>
        <p className="text-xs text-[color:var(--muted-foreground)] leading-relaxed">
          {description}
        </p>
      </div>
      {action}
    </div>
  );
}

/* ── Tiny helper for "← Back to Sign In" style links ────── */

export function AuthSuccessLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="text-xs font-semibold text-[color:var(--foreground)] hover:underline"
    >
      {children}
    </Link>
  );
}
