"use client";

import { useState } from "react";
import Link from "next/link";
import AuthLayout from "@/components/auth/AuthLayout";
import AuthInput from "@/components/auth/AuthInput";
import FormError from "@/components/FormError";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      setSuccess(true);
    } catch {
      setError("Unable to connect to the server. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      left={{
        headline: <>Reset<br />Your<br />Password</>,
        subtext: "Don\u2019t worry, it happens to the best of us. Enter your email and we\u2019ll send you a reset link.",
      }}
      footer={{ text: "Remember your password?", linkText: "Sign In", href: "/login" }}
    >
      {success ? (
        <div className="flex-1 flex flex-col justify-center w-full max-w-[380px] mx-auto text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-green-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-[color:var(--foreground)] mb-2">Check Your Email</h1>
            <p className="text-xs text-[color:var(--muted-foreground)] leading-relaxed">
              If an account exists with that email, we&apos;ve sent a password reset link. Please check your inbox and spam folder.
            </p>
          </div>
          <Link href="/login" className="text-xs font-semibold text-[color:var(--foreground)] hover:underline">
            &larr; Back to Sign In
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-center w-full max-w-[380px] mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-[color:var(--foreground)] mb-2">Forgot Password</h1>
            <p className="text-xs text-[color:var(--muted-foreground)]">
              Enter your email address and we&apos;ll send you a link to reset your password
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <FormError message={error} />

            <AuthInput icon="email" id="forgot-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" disabled={loading} />

            <button type="submit" disabled={loading} className="w-full rounded-full bg-[color:var(--foreground)] py-4 font-bold text-[color:var(--background)] text-sm active:scale-95 hover:opacity-90 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}
