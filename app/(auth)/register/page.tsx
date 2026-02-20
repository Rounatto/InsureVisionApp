"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthLayout from "@/components/auth/AuthLayout";
import AuthInput from "@/components/auth/AuthInput";
import GoogleButton from "@/components/auth/GoogleButton";
import FormError from "@/components/FormError";
import type { ErrorResponse, RegisterResponse } from "@/types/auth";

export default function Register() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const clearErrors = () => { setGeneralError(""); setFieldErrors({}); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, confirmPassword }),
      });

      const data: RegisterResponse | ErrorResponse = await res.json();

      if (res.status === 201 && data.success) {
        router.push("/login");
        return;
      }

      if (res.status === 400 && "errors" in data && data.errors) {
        const mapped: Record<string, string> = {};
        for (const err of data.errors) mapped[err.field] = err.message;
        setFieldErrors(mapped);
        return;
      }

      setGeneralError(data.message || "Something went wrong. Please try again.");
    } catch {
      setGeneralError("Unable to connect to the server. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      left={{
        headline: <>Accelerate<br />Your Claims<br />Processing</>,
        gradientTo: "to-transparent",
        extra: (
          <div className="bg-left-dynamic/10 backdrop-blur-md border border-left-dynamic/20 p-4 rounded-2xl max-w-xs">
            <p className="text-sm leading-relaxed mb-3 text-white/90 italic">
              &ldquo;InsureVision has saved our adjusters 40% of their time.&rdquo;
            </p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-400 border border-white/50" />
              <div>
                <p className="text-xs font-bold text-white">Sari Parantainen</p>
                <p className="text-[10px] text-white/60">Claims Director</p>
              </div>
            </div>
          </div>
        ),
      }}
      footer={{ text: "Already have an account?", linkText: "Sign in", href: "/login" }}
      rightClassName="py-4"
    >
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-center w-full max-w-[380px] mx-auto">
        <div className="text-center mb-5">
          <h1 className="text-4xl font-bold text-[color:var(--foreground)] mb-2">Create Account</h1>
          <p className="text-xs text-[color:var(--muted-foreground)]">Join our network of smart insurance adjusters</p>
        </div>

        <div className="flex flex-col gap-2.5 text-[color:var(--foreground)]">
          <FormError message={generalError} />

          <AuthInput icon="user" id="register-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name" disabled={loading} error={fieldErrors.name} />

          <AuthInput icon="email" id="register-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" disabled={loading} error={fieldErrors.email} />

          {/* Passwords side-by-side */}
          <div className="flex gap-3">
            <AuthInput icon="lock" id="register-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" disabled={loading} passwordToggle compact error={fieldErrors.password} className="w-1/2" />

            <AuthInput icon="shield" id="register-confirm" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm" disabled={loading} compact error={fieldErrors.confirmPassword} className="w-1/2" />
          </div>

          <div className="flex flex-col gap-2.5 mt-2">
            <button type="submit" disabled={loading} className="w-full rounded-full bg-[color:var(--foreground)] py-3.5 font-bold text-[color:var(--background)] text-sm active:scale-95 hover:opacity-90 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? "Creating Account..." : "Create Account"}
            </button>

            <GoogleButton label="Sign up with Google" disabled={loading} onError={setGeneralError} className="py-3.5 text-xs" />
          </div>
        </div>
      </form>
    </AuthLayout>
  );
}