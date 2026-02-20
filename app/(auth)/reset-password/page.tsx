"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import AuthLayout from "@/components/auth/AuthLayout";
import AuthInput from "@/components/auth/AuthInput";
import FormError from "@/components/FormError";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword }),
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

  if (!token) {
    return (
      <div className="flex-1 flex flex-col justify-center w-full max-w-[380px] mx-auto text-center">
        <h1 className="text-3xl font-bold text-red-500 mb-2">Invalid Link</h1>
        <p className="text-xs text-[color:var(--muted-foreground)] mb-4">
          This password reset link is invalid or has expired.
        </p>
        <Link href="/forgot-password" className="text-xs font-semibold text-[color:var(--foreground)] hover:underline">
          Request a new reset link
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex-1 flex flex-col justify-center w-full max-w-[380px] mx-auto text-center">
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-green-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-[color:var(--foreground)] mb-2">Password Reset!</h1>
          <p className="text-xs text-[color:var(--muted-foreground)]">
            Your password has been successfully reset. You can now sign in with your new password.
          </p>
        </div>
        <Link
          href="/login"
          className="w-full rounded-full bg-[color:var(--foreground)] py-4 font-bold text-[color:var(--background)] text-sm active:scale-95 hover:opacity-90 cursor-pointer text-center block"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-center w-full max-w-[380px] mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-[color:var(--foreground)] mb-2">New Password</h1>
        <p className="text-xs text-[color:var(--muted-foreground)]">Enter your new password below</p>
      </div>

      <div className="flex flex-col gap-4">
        <FormError message={error} />

        <AuthInput icon="lock" id="reset-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New Password" disabled={loading} passwordToggle />

        <AuthInput icon="shield" id="reset-confirm" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm Password" disabled={loading} />

        <p className="text-[10px] text-[color:var(--muted-foreground)] px-2">
          Password must be at least 8 characters with uppercase, lowercase, and a number.
        </p>

        <button type="submit" disabled={loading} className="w-full rounded-full bg-[color:var(--foreground)] py-4 font-bold text-[color:var(--background)] text-sm active:scale-95 hover:opacity-90 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? "Resetting..." : "Reset Password"}
        </button>
      </div>
    </form>
  );
}

export default function ResetPassword() {
  return (
    <AuthLayout
      left={{
        headline: <>Secure<br />Your<br />Account</>,
        subtext: "Choose a strong password to keep your account safe and secure.",
      }}
      footer={{ text: "Remember your password?", linkText: "Sign In", href: "/login" }}
    >
      <Suspense
        fallback={
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-[color:var(--muted-foreground)]">Loading...</p>
          </div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </AuthLayout>
  );
}
