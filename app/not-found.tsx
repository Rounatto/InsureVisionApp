import Link from "next/link";
import InsureVisionLogo from "@/components/InsureVisionLogo";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[color:var(--background)] text-[color:var(--foreground)] px-4">
      <InsureVisionLogo className="h-16 w-16 mb-8 opacity-20" />

      <h1 className="text-6xl font-bold mb-2">404</h1>
      <p className="text-lg text-[color:var(--muted-foreground)] mb-8">
        The page you&apos;re looking for doesn&apos;t exist.
      </p>

      <div className="flex gap-4">
        <Link
          href="/"
          className="px-6 py-3 rounded-full bg-[color:var(--foreground)] text-[color:var(--background)] text-sm font-bold hover:opacity-90 transition"
        >
          Go Home
        </Link>
        <Link
          href="/dashboard"
          className="px-6 py-3 rounded-full border border-[color:var(--border)] text-sm font-medium hover:bg-[color:var(--muted)] transition"
        >
          Dashboard
        </Link>
      </div>
    </div>
  );
}
