"use client";

import { type ReactNode, useState } from "react";
import { EmailIcon, LockIcon, UserIcon, ShieldIcon } from "@/lib/icons";

/* ── Icon lookup ─────────────────────────────────────────── */

const icons = {
  email: <EmailIcon />,
  lock: <LockIcon />,
  user: <UserIcon />,
  shield: <ShieldIcon />,
} as const;

export type IconName = keyof typeof icons;

/* ── Eye toggle SVGs ─────────────────────────────────────── */

const EyeOff = (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-[18px] h-[18px]">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
  </svg>
);

const EyeOn = (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-[18px] h-[18px]">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

/* ── Component ───────────────────────────────────────────── */

interface AuthInputProps {
  /** Named icon from the built-in set, or a custom ReactNode */
  icon: IconName | ReactNode;
  id?: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  /** Show a toggle for password visibility */
  passwordToggle?: boolean;
  /** Field-level error text (shown below input) */
  error?: string;
  /** Extra className on the wrapper */
  className?: string;
  /** Override icon/input size classes for compact layouts */
  compact?: boolean;
}

export default function AuthInput({
  icon,
  id,
  type = "text",
  value,
  onChange,
  placeholder,
  disabled,
  passwordToggle,
  error,
  className = "",
  compact,
}: AuthInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  const getResolvedIcon = () => {
    if (typeof icon !== "string") {
      return icon;
    }

    return icons[icon as IconName];
  };

  const getResolvedType = () => {
    const isPasswordInput = passwordToggle || type === "password";

    if (!isPasswordInput) {
      return type;
    }

    if (showPassword) {
      return "text";
    }

    return "password";
  };

  const resolvedIcon = getResolvedIcon();
  const isPassword = passwordToggle || type === "password";
  const resolvedType = getResolvedType();

  const iconSize = compact ? "w-[16px] h-[16px]" : "w-[18px] h-[18px]";
  const padRight = isPassword ? (compact ? "pr-9" : "pr-12") : "pr-5";
  const padLeft = compact ? "pl-10" : "pl-11";

  return (
    <div className={className}>
      <div className="relative">
        {/* Left icon */}
        <div className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 ${iconSize} text-[color:var(--foreground)]/40`}>
          {resolvedIcon}
        </div>

        <input
          id={id}
          type={resolvedType}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          className={`w-full rounded-full border border-[color:var(--border)] bg-[color:var(--card)] ${padLeft} ${padRight} py-3.5 text-sm text-[color:var(--foreground)] placeholder:text-[color:var(--foreground)]/40 focus:outline-none focus:ring-2 focus:ring-[color:var(--foreground)]/10 disabled:opacity-50`}
        />

        {/* Password toggle */}
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className={`absolute ${compact ? "right-3.5" : "right-4"} top-1/2 -translate-y-1/2 text-[color:var(--foreground)]/40 hover:text-[color:var(--foreground)]/70`}
          >
            {showPassword ? EyeOff : EyeOn}
          </button>
        )}
      </div>

      {error && <p className="mt-1 ml-3 text-[11px] text-red-500">{error}</p>}
    </div>
  );
}
