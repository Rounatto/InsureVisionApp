"use client";

import { type ReactNode, type ButtonHTMLAttributes } from "react";

/**
 * Primary CTA button with consistent styling across the app.
 *
 * Sizing:
 *  - `lg`  → py-4         (auth forms)
 *  - `md`  → py-3.5       (register)
 *  - `sm`  → py-3         (upload)
 *  - `xs`  → py-2.5       (profile save)
 */

type Size = "lg" | "md" | "sm" | "xs";

const SIZE_CLASSES: Record<Size, string> = {
  lg: "py-4",
  md: "py-3.5",
  sm: "py-3",
  xs: "py-2.5",
};

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  /** Vertical padding – defaults to `lg` */
  size?: Size;
  /** Full-width (w-full) – defaults to true */
  fullWidth?: boolean;
  /** Extra className */
  className?: string;
}

export default function PrimaryButton({
  children,
  size = "lg",
  fullWidth = true,
  className = "",
  ...rest
}: PrimaryButtonProps) {
  const getWidthClass = () => {
    if (fullWidth) {
      return "w-full";
    }

    return "px-8";
  };

  const widthClass = getWidthClass();

  return (
    <button
      {...rest}
      className={`rounded-full bg-[color:var(--foreground)] ${SIZE_CLASSES[size]} font-bold text-[color:var(--background)] text-sm hover:opacity-90 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${widthClass} ${className}`}
    >
      {children}
    </button>
  );
}
