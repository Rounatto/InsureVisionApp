"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import AuthLayout from "@/components/auth/AuthLayout";
import AuthInput from "@/components/auth/AuthInput";
import FormError from "@/components/FormError";
import PrimaryButton from "@/components/PrimaryButton";
import AuthSuccess from "@/components/auth/AuthSuccess";
import { AuthSuccessLink } from "@/components/auth/AuthSuccess";
import { CheckCircleIcon } from "@/lib/icons";
import { NETWORK_ERROR_MESSAGE } from "@/lib/constants";

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
        setError(data.message || "Something went wrong");
        return;
      }

      setSuccess(true);
    } catch {
      setError(NETWORK_ERROR_MESSAGE);
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
        <AuthSuccess
          icon={<CheckCircleIcon className="w-8 h-8 text-green-600" strokeWidth={2} />}
          title="Password Reset!"
          description="Your password has been successfully reset. You can now sign in with your new password."
          action={
            <AuthSuccessLink href="/login">Sign In</AuthSuccessLink>
          }
        />
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

        <PrimaryButton type="submit" disabled={loading}>
          {loading ? "Resetting..." : "Reset Password"}
        </PrimaryButton>
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
