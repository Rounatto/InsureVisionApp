export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[color:var(--background)]">
      <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-[color:var(--foreground)] border-t-transparent" />
    </div>
  );
}
