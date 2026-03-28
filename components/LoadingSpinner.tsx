"use client";

import React from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  fullScreen?: boolean;
  label?: string;
}

export default function LoadingSpinner({
  size = "md",
  fullScreen = false,
  label = "Uploading...",
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-16 h-16",
    lg: "w-24 h-24",
  };

  const labelSize = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center gap-4">
      {/* Main Spinner Container */}
      <div className="relative">
        {/* Outer rotating ring - gradient primary color */}
        <svg
          className={`${sizeClasses[size]} animate-spin`}
          style={{ animationDuration: "3s" }}
          viewBox="0 0 100 100"
          fill="none"
        >
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
              <stop offset="50%" stopColor="currentColor" stopOpacity="0.5" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="url(#gradient)"
            strokeWidth="2"
            strokeDasharray="141"
            strokeDashoffset="0"
          />
        </svg>

        {/* Inner pulsing ring */}
        <div
          className="absolute inset-3 rounded-full border border-primary/20 animate-pulse"
          style={{
            animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
          }}
        />

        {/* Center dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-primary to-primary/50" />
        </div>
      </div>

      {/* Loading text */}
      {label && (
        <p className={`${labelSize[size]} font-medium text-[color:var(--foreground)] animate-pulse`}>
          {label}
        </p>
      )}

      {/* Animated bottom dots */}
      <div className="flex gap-1.5 pt-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-primary/70"
            style={{
              animation: `bounce 1.4s infinite`,
              animationDelay: `${i * 0.16}s`,
            }}
          />
        ))}
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
}
