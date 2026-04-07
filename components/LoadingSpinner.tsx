'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
  label?: string;
}

export default function LoadingSpinner({
  size = 'md',
  fullScreen = false,
  label = 'Uploading...',
}: LoadingSpinnerProps) {
  const sizeClasses: Record<
    NonNullable<LoadingSpinnerProps['size']>,
    string
  > = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const labelSize = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const accessibleLabel = label || 'Loading';

  const spinner = (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center gap-3 text-[color:var(--foreground)]"
    >
      <Loader2
        className={`${sizeClasses[size]} animate-spin motion-reduce:animate-none`}
        aria-hidden="true"
      />
      {label ? (
        <p
          className={`${labelSize[size]} font-medium text-[color:var(--foreground)]`}
        >
          {label}
        </p>
      ) : (
        <span className="sr-only">{accessibleLabel}</span>
      )}
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
