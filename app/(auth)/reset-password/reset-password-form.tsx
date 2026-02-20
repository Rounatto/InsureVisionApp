"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ThemeSwitcher } from "@/components/theme-switcher";
import InsureVisionLogo from "@/components/InsureVisionLogo";
import type { AuthResponse, ErrorResponse } from "@/types/auth";

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get("token") ?? "", [searchParams]);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!token) {
      setError("Reset token is missing. Please request a new reset link.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword }),
      });

      const data: AuthResponse | ErrorResponse = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || "Unable to reset password.");
        return;
      }

      setMessage(data.message);
      setTimeout(() => router.push("/login"), 1200);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex h-screen w-full items-center justify-center bg-[url('/background2.jpg')] bg-cover bg-center p-4 overflow-hidden">
      <div className="relative w-full max-w-md rounded-[32px] bg-[color:var(--card)] p-8 shadow-2xl">
        <div className="absolute top-4 right-4 z-50">
          <ThemeSwitcher />
        </div>

        <div className="mb-6 flex justify-center">
          <InsureVisionLogo className="h-auto w-14" />
        </div>

        <h1 className="mb-2 text-center text-3xl font-serif italic text-primary">
          Reset Password
        </h1>
        <p className="mb-6 text-center text-xs text-[color:var(--muted-foreground)]">
          Enter a new password for your account.
        </p>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs text-red-600">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs text-emerald-700">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 ml-1 block text-xs font-medium text-[color:var(--foreground)]">
              New password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password"
              required
              disabled={loading}
              className="w-full rounded-full border border-[color:var(--border)] bg-white p-3.5 text-sm text-gray-600 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="mb-1.5 ml-1 block text-xs font-medium text-[color:var(--foreground)]">
              Confirm password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
              disabled={loading}
              className="w-full rounded-full border border-[color:var(--border)] bg-white p-3.5 text-sm text-gray-600 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !token}
            className="w-full rounded-full [.theme-light_&]:bg-black [.theme-light_&]:text-white [.theme-dark_&]:bg-white [.theme-dark_&]:text-black py-3.5 font-bold text-sm hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-[color:var(--muted-foreground)]">
          Back to{" "}
          <Link
            href="/login"
            className="font-bold text-[color:var(--foreground)] hover:underline"
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
