interface UserAvatarProps {
  name?: string | null;
  /** Tailwind size classes, e.g. "h-9 w-9" or "h-14 w-14" */
  size?: string;
  /** Extra text-size class, e.g. "text-xs" or "text-xl" */
  textSize?: string;
  className?: string;
}

export default function UserAvatar({
  name,
  size = "h-9 w-9",
  textSize = "text-xs",
  className = "",
}: UserAvatarProps) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-[color:var(--muted)] border border-[color:var(--border)] font-bold text-[color:var(--foreground)] ${size} ${textSize} ${className}`}
    >
      {(name || "U").charAt(0).toUpperCase()}
    </div>
  );
}
