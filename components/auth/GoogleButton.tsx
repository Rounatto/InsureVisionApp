"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { GoogleLogo } from "@/lib/icons";

interface GoogleButtonProps {
  /** e.g. "Sign In with Google" or "Sign up with Google" */
  label: string;
  loadingLabel?: string;
  disabled?: boolean;
  onError?: (msg: string) => void;
  /** Extra className */
  className?: string;
}

export default function GoogleButton({
  label,
  loadingLabel = "Connecting...",
  disabled,
  onError,
  className = "",
}: GoogleButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      await signIn("google", { callbackUrl: "/" });
    } catch {
      onError?.("Google sign-in failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || loading}
      className={`flex w-full items-center justify-center gap-3 rounded-full border border-gray-200 bg-[color:var(--secondary-button-bg)] py-4 font-semibold text-[color:var(--secondary-button-text)] hover:bg-gray-50 text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      <GoogleLogo />
      {loading ? loadingLabel : label}
    </button>
  );
}
