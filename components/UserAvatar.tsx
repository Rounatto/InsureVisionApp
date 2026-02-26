interface UserAvatarProps {
  name?: string | null;
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
  size = "h-9 w-9",
  textSize = "text-xs",
  className = "",
  loading = false,
}: UserAvatarProps) {
  const showLetter = !loading && name !== undefined;

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-[color:var(--muted)] border border-[color:var(--border)] font-bold text-[color:var(--foreground)] select-none ${size} ${textSize} ${className} ${loading ? "animate-pulse" : ""}`}
    >
      {showLetter ? (name || "U").charAt(0).toUpperCase() : ""}
    </div>
  );
}
