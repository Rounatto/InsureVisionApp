"use client";

import { useState } from "react";

interface UserAvatarProps {
  name?: string | null;
  image?: string | null;
  /** Tailwind size classes, e.g. "h-9 w-9" or "h-14 w-14" */
  size?: string;
  /** Extra text-size class, e.g. "text-xs" or "text-xl" */
  textSize?: string;
  className?: string;
  /** Show a loading skeleton instead of a letter */
  loading?: boolean;
}

export default function UserAvatar({
  name,
  image,
  size = "h-9 w-9",
  textSize = "text-xs",
  className = "",
  loading = false,
}: UserAvatarProps) {
  const [failedImageSrc, setFailedImageSrc] = useState<string | null>(null);

  const showImage = !loading && Boolean(image) && failedImageSrc !== image;
  const showLetter = !loading && !showImage && name !== undefined;

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-[color:var(--muted)] border border-[color:var(--border)] font-bold text-[color:var(--foreground)] select-none ${size} ${textSize} ${className} ${loading ? "animate-pulse" : ""}`}
    >
      {showImage && (
        <img
          src={image || ""}
          alt={name ? `${name} avatar` : "User avatar"}
          className="h-full w-full rounded-full object-cover"
          onError={() => setFailedImageSrc(image || null)}
        />
      )}
      {showLetter ? (name || "U").charAt(0).toUpperCase() : ""}
    </div>
  );
}
