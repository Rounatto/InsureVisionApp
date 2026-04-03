"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import InsureVisionLogo from "@/components/InsureVisionLogo";
import LightRays from "@/components/LightRays";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "your email address";

  return (
    <div className="relative flex h-screen w-full items-center justify-center bg-black p-4 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <LightRays
          raysOrigin="top-center"
          raysColor="#ffffff"
          raysSpeed={0.8}
          lightSpread={0.6}
          rayLength={1}
          pulsating={false}
          fadeDistance={1}
          saturation={1}
          followMouse
          mouseInfluence={0.2}
          noiseAmount={0}
          distortion={0}
        />
      </div>

      <div className="relative z-10 flex w-full max-w-2xl overflow-hidden rounded-[32px] shadow-2xl bg-[color:var(--card)] px-8 py-10 md:px-12 md:py-12">
        <div className="absolute top-4 right-4 z-50 text-[color:var(--foreground)]">
          <ThemeSwitcher />
        </div>

        <div className="mx-auto w-full max-w-lg text-center">
          <div className="mb-6 flex justify-center">
            <InsureVisionLogo className="h-auto w-16" />
          </div>

          <h1 className="text-4xl font-serif italic text-primary mb-3">Verify Your Email</h1>
          <p className="text-sm text-[color:var(--muted-foreground)] mb-2">
            Your account was created successfully.
          </p>
          <p className="text-sm text-[color:var(--muted-foreground)] mb-8">
            We sent a verification link to <span className="font-semibold text-[color:var(--foreground)]">{email}</span>. Please open your inbox and click the link to activate your account.
          </p>

          <div className="flex flex-col gap-3">
            <Link
              href="/login"
              className="w-full rounded-full [.theme-light_&]:bg-black [.theme-light_&]:text-white [.theme-dark_&]:bg-white [.theme-dark_&]:text-black py-3.5 font-bold text-sm hover:opacity-90"
            >
              Back To Login
            </Link>
            <Link
              href="/register"
              className="w-full rounded-full border border-[color:var(--border)] py-3.5 font-semibold text-sm text-[color:var(--foreground)] hover:bg-[color:var(--muted)]/40"
            >
              Use A Different Email
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
