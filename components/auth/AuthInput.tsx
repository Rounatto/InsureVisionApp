'use client';

import { type ReactNode, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { EmailIcon, LockIcon, UserIcon, ShieldIcon } from '@/lib/icons';

/* ── Icon lookup ─────────────────────────────────────────── */

const icons = {
  email: <EmailIcon />,
  lock: <LockIcon />,
  user: <UserIcon />,
  shield: <ShieldIcon />,
} as const;

export type IconName = keyof typeof icons;

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
  type = 'text',
  value,
  onChange,
  placeholder,
  disabled,
  passwordToggle,
  error,
  className = '',
  compact,
}: AuthInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  const resolvedIcon =
    typeof icon === 'string' ? icons[icon as IconName] : icon;
  const isPassword = passwordToggle || type === 'password';
  const resolvedType = isPassword ? (showPassword ? 'text' : 'password') : type;

  const iconSize = compact ? 'w-[16px] h-[16px]' : 'w-[18px] h-[18px]';
  const padRight = isPassword ? (compact ? 'pr-9' : 'pr-12') : 'pr-5';
  const padLeft = compact ? 'pl-10' : 'pl-11';

  return (
    <div className={className}>
      <div className="relative">
        {/* Left icon */}
        <div
          className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 ${iconSize} text-[color:var(--foreground)]/40`}
        >
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
            className={`absolute ${compact ? 'right-3.5' : 'right-4'} top-1/2 -translate-y-1/2 text-[color:var(--foreground)]/40 hover:text-[color:var(--foreground)]/70`}
          >
            {showPassword ? (
              <EyeOff className={iconSize} />
            ) : (
              <Eye className={iconSize} />
            )}
          </button>
        )}
      </div>

      {error && <p className="mt-1 ml-3 text-[11px] text-red-500">{error}</p>}
    </div>
  );
}
