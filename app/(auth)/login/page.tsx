"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import AuthLayout from "@/components/auth/AuthLayout";
import AuthInput from "@/components/auth/AuthInput";
import GoogleButton from "@/components/auth/GoogleButton";
import FormError from "@/components/FormError";
import PrimaryButton from "@/components/PrimaryButton";
import { NETWORK_ERROR_MESSAGE } from "@/lib/constants";

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
        return;
      }

      router.push("/");
    } catch {
      setError(NETWORK_ERROR_MESSAGE);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      left={{
        headline: <>Smart<br />Damage<br />Estimation</>,
        subtext: "Upload detailed car photos and let our AI generate accurate repair costs in seconds.",
        extra: (
          <div className="mt-6 flex items-center gap-3 opacity-90">
            <div className="flex -space-x-2">
              <div className="h-6 w-6 rounded-full border border-white bg-gray-500" />
              <div className="h-6 w-6 rounded-full border border-white bg-gray-400" />
              <div className="h-6 w-6 rounded-full border border-white bg-gray-300" />
            </div>
            <span className="text-[10px] font-semibold tracking-wide uppercase text-left-dynamic/70">
              Trusted by Top Insurers
            </span>
          </div>
        ),
      }}
      footer={{ text: "Don't have an account?", linkText: "Sign Up", href: "/register" }}
    >
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-center w-full max-w-[380px] mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[color:var(--foreground)] mb-2">Welcome Back</h1>
          <p className="text-xs text-[color:var(--muted-foreground)]">
            Enter your email and password to access your account
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <FormError message={error} />

          <AuthInput icon="email" id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" disabled={loading} />

          <AuthInput icon="lock" id="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" disabled={loading} passwordToggle />

          <div className="flex items-center justify-between px-1">
            <label className="flex items-center gap-2 text-xs text-[color:var(--muted-foreground)] cursor-pointer select-none">
              <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="rounded border-[color:var(--border)] accent-[color:var(--foreground)]" />
              Remember me
            </label>
            <Link href="/forgot-password" className="text-xs font-semibold text-[color:var(--foreground)] hover:underline">
              Forgot Password?
            </Link>
          </div>

          <div className="flex flex-col gap-3 mt-2">
            <PrimaryButton type="submit" disabled={loading}>
              {loading ? "Signing In..." : "Sign In"}
            </PrimaryButton>

            <GoogleButton label="Sign In with Google" disabled={loading} onError={setError} />
          </div>
        </div>
      </form>
    </AuthLayout>
  );
}