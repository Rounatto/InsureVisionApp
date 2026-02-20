"use client";

import { type ReactNode } from "react";
import Link from "next/link";
import { ThemeSwitcher } from "@/components/theme-switcher";
import InsureVisionLogo from "@/components/InsureVisionLogo";

/* ── Left-panel presets ──────────────────────────────────── */

interface LeftContent {
  headline: ReactNode;
  subtext?: ReactNode;
  /** Extra element under the subtext (e.g. testimonial card, avatars row) */
  extra?: ReactNode;
  /** Gradient ending colour – default "to-black/10" */
  gradientTo?: string;
}

interface AuthLayoutProps {
  left: LeftContent;
  /** Footer link row */
  footer: { text: string; linkText: string; href: string };
  children: ReactNode;
  /** Override right-panel inner spacing */
  rightClassName?: string;
}

export default function AuthLayout({
  left,
  footer,
  children,
  rightClassName = "py-6",
}: AuthLayoutProps) {
  return (
    <div className="relative flex h-screen w-full items-center justify-center bg-[url('/background2.jpg')] bg-cover bg-center p-4 overflow-hidden">
      {/* Theme toggle */}
      <div className="absolute top-4 right-4 z-50 text-white">
        <ThemeSwitcher />
      </div>

      {/* Main card */}
      <div className="flex w-full max-w-5xl h-[85vh] min-h-[600px] overflow-hidden rounded-[40px] shadow-2xl bg-[color:var(--card)] font-sans">
        {/* ── Left section ─────────────────────────────────── */}
        <div className="hidden md:flex md:w-1/2 flex-col justify-between bg-[url('/background2.jpg')] bg-cover bg-center p-12 relative">
          <div
            className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 ${left.gradientTo ?? "to-black/10"} pointer-events-none`}
          />

          {/* Branding */}
          <div className="relative z-10 flex items-center gap-3">
            <span className="text-xs font-bold tracking-widest uppercase text-left-dynamic brightness-150">
              InsureVision AI
            </span>
            <div className="h-[1px] w-12 bg-left-dynamic/50" />
          </div>

          {/* Headline + subtext + extra */}
          <div className="relative z-10 mb-4">
            <h1 className="text-5xl font-bold leading-tight mb-4 text-left-dynamic brightness-125">
              {left.headline}
            </h1>
            {left.subtext && (
              <p className="text-sm text-left-dynamic/80 font-light leading-relaxed max-w-xs">
                {left.subtext}
              </p>
            )}
            {left.extra}
          </div>
        </div>

        {/* ── Right section ────────────────────────────────── */}
        <div
          className={`flex w-full md:w-1/2 flex-col h-full px-8 md:px-12 ${rightClassName} justify-between bg-[color:var(--card)]`}
        >
          {/* Logo */}
          <div className="flex-none flex justify-center pt-4">
            <InsureVisionLogo className="h-auto w-16" />
          </div>

          {/* Page-specific content (forms, success states, etc.) */}
          <div className="flex-1 flex flex-col justify-center w-full max-w-[380px] mx-auto">
            {children}
          </div>

          {/* Footer */}
          <div className="flex-none text-center pb-2 pt-4">
            <p className="text-xs text-[color:var(--muted-foreground)]">
              {footer.text}{" "}
              <Link
                href={footer.href}
                className="font-bold text-[color:var(--foreground)] hover:underline"
              >
                {footer.linkText}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
