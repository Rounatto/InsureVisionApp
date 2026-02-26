"use client";

import { useState } from "react";
import AuthLayout from "@/components/auth/AuthLayout";
import AuthInput from "@/components/auth/AuthInput";
import FormError from "@/components/FormError";
import PrimaryButton from "@/components/PrimaryButton";
import AuthSuccess from "@/components/auth/AuthSuccess";
import { AuthSuccessLink } from "@/components/auth/AuthSuccess";
import { EmailIcon } from "@/lib/icons";
import { NETWORK_ERROR_MESSAGE } from "@/lib/constants";

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
      setError(NETWORK_ERROR_MESSAGE);
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
          <AuthSuccess
            icon={<EmailIcon className="w-8 h-8 text-green-600" strokeWidth={2} />}
            title="Check Your Email"
            description="If an account exists with that email, we've sent a password reset link. Please check your inbox and spam folder."
            action={<AuthSuccessLink href="/login">&larr; Back to Sign In</AuthSuccessLink>}
          />
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

            <PrimaryButton type="submit" disabled={loading}>
              {loading ? "Sending..." : "Send Reset Link"}
            </PrimaryButton>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}
