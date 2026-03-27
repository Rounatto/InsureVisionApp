"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { downloadEstimatePdf } from "@/lib/generatePdf";
import { NETWORK_ERROR_MESSAGE } from "@/lib/constants";

interface EstimatePart {
  name: string;
  cost: number;
  severity: string;
}

interface Estimate {
  id: string;
  totalCost: number;
  parts: EstimatePart[];
  photos: string[];
  summary: string;
  createdAt: string;
}

export default function HistoryPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEstimates() {
      try {
        const res = await fetch("/api/estimates");
        if (!res.ok) {
          setError("Failed to load history.");
          setLoading(false);
          return;
        }
        const data = await res.json();
        setEstimates(data);
      } catch {
        setError(NETWORK_ERROR_MESSAGE);
      }
      setLoading(false);
    }
    fetchEstimates();
  }, []);

  const toggle = (id: string) =>
    setExpandedId((prev) => (prev === id ? null : id));

  const totalAmount = estimates.reduce((sum, est) => sum + est.totalCost, 0);

  return (
      <main className="relative mx-auto max-w-5xl px-6 py-14 sm:py-16">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-[radial-gradient(ellipse_at_top,rgba(120,120,120,0.15),transparent_65%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 right-0 -z-10 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(120,120,120,0.12),transparent_70%)]"
        />

        <div className="mb-10 text-center">
          <span className="mb-4 inline-flex rounded-full border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-1 text-[11px] font-medium tracking-wide text-[color:var(--muted-foreground)]">
            Past Reports
          </span>
          <h1 className="mb-3 text-4xl font-bold text-[color:var(--foreground)] sm:text-5xl">
            Estimation History
          </h1>
          <p className="mx-auto max-w-lg text-sm text-[color:var(--muted-foreground)]">
            View all your past damage estimates.
          </p>
        </div>

        {!loading && !error && estimates.length > 0 && (
          <div className="mx-auto mb-8 grid max-w-4xl gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)]/80 p-4 text-left backdrop-blur-sm">
              <span className="mb-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[color:var(--muted)] text-[color:var(--foreground)]">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </span>
              <p className="text-[11px] uppercase tracking-wide text-[color:var(--muted-foreground)]">
                Total Estimates
              </p>
              <p className="mt-1 text-lg font-semibold text-[color:var(--foreground)]">
                {estimates.length}
              </p>
            </div>
            <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)]/80 p-4 text-left backdrop-blur-sm">
              <span className="mb-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[color:var(--muted)] text-[color:var(--foreground)]">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-2.21 0-4 .895-4 2s1.79 2 4 2 4 .895 4 2-1.79 2-4 2m0-10V6m0 12v-2" />
                </svg>
              </span>
              <p className="text-[11px] uppercase tracking-wide text-[color:var(--muted-foreground)]">
                Total Value
              </p>
              <p className="mt-1 text-lg font-semibold text-[color:var(--foreground)]">
                ${totalAmount.toLocaleString()}
              </p>
            </div>
            <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)]/80 p-4 text-left backdrop-blur-sm">
              <span className="mb-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[color:var(--muted)] text-[color:var(--foreground)]">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
                </svg>
              </span>
              <p className="text-[11px] uppercase tracking-wide text-[color:var(--muted-foreground)]">
                Last Activity
              </p>
              <p className="mt-1 text-lg font-semibold text-[color:var(--foreground)]">
                {new Date(estimates[0].createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
        )}

        {loading && (
          <div className="mx-auto max-w-xl rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] py-16">
            <div className="flex justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[color:var(--foreground)] border-t-transparent" />
            </div>
          </div>
        )}

        {error && (
          <p className="text-center text-sm text-red-500">{error}</p>
        )}

        {!loading && !error && estimates.length === 0 && (
          <div className="mx-auto max-w-xl rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] py-20 text-center">
            <p className="text-sm text-[color:var(--muted-foreground)] mb-4">
              No estimates yet.
            </p>
            <button
              onClick={() => router.push("/dashboard")}
              className="rounded-full bg-[color:var(--foreground)] px-6 py-2.5 text-sm font-bold text-[color:var(--background)] hover:opacity-90 active:scale-95 transition-all"
            >
              Create Your First Estimate
            </button>
          </div>
        )}

        {!loading && estimates.length > 0 && (
          <div className="mx-auto max-w-4xl space-y-4">
            {estimates.map((est) => {
              const expanded = expandedId === est.id;
              const date = new Date(est.createdAt).toLocaleDateString(
                "en-US",
                { year: "numeric", month: "short", day: "numeric" }
              );

              return (
                <div
                  key={est.id}
                  className="group overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)]/90 shadow-sm backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                >
                  {/* Collapsed header — always visible */}
                  <button
                    onClick={() => toggle(est.id)}
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-[color:var(--muted)]/30 transition-colors"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <span className="rounded-md bg-[color:var(--muted)] px-2 py-1 text-[10px] font-mono text-[color:var(--muted-foreground)]">
                        {est.id}
                      </span>
                      <span className="text-xs text-[color:var(--muted-foreground)] hidden sm:inline">
                        {date}
                      </span>
                      <span className="hidden rounded-full border border-[color:var(--border)] px-2 py-1 text-[10px] text-[color:var(--muted-foreground)] sm:inline">
                        {est.parts.length} part{est.parts.length > 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="rounded-full bg-[color:var(--muted)] px-3 py-1 text-sm font-bold text-[color:var(--foreground)]">
                        ${est.totalCost.toLocaleString()}
                      </span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className={`h-4 w-4 text-[color:var(--muted-foreground)] transition-transform ${expanded ? "rotate-180" : ""}`}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </div>
                  </button>

                  {/* Expanded details */}
                  {expanded && (
                    <div className="px-5 pb-5 border-t border-[color:var(--border)]">
                      <p className="text-xs text-[color:var(--muted-foreground)] mt-4 mb-4 sm:hidden">
                        {date}
                      </p>
                      <p className="mb-4 rounded-xl bg-[color:var(--muted)]/40 px-3 py-2 text-sm text-[color:var(--muted-foreground)]">
                        {est.summary}
                      </p>

                      {/* Parts */}
                      <div className="space-y-2 mb-4">
                        {est.parts.map((part, i) => (
                          <div key={i} className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-[color:var(--muted)]/30">
                            <div className="flex items-center gap-2">
                              <span
                                className={`inline-block h-2 w-2 rounded-full ${
                                  part.severity === "High"
                                    ? "bg-red-500"
                                    : part.severity === "Medium"
                                      ? "bg-yellow-500"
                                      : "bg-green-500"
                                }`}
                              />
                              <span className="text-sm text-[color:var(--foreground)]">
                                {part.name}
                              </span>
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                  part.severity === "High"
                                    ? "bg-red-500/15 text-red-500"
                                    : part.severity === "Medium"
                                      ? "bg-yellow-500/20 text-yellow-600"
                                      : "bg-green-500/15 text-green-600"
                                }`}
                              >
                                {part.severity}
                              </span>
                            </div>
                            <span className="text-sm font-medium text-[color:var(--foreground)]">
                              ${part.cost.toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Photos */}
                      {est.photos.length > 0 && (
                        <p className="text-xs text-[color:var(--muted-foreground)] mb-4">
                          {est.photos.length} photo{est.photos.length > 1 ? "s" : ""} uploaded
                        </p>
                      )}

                      {/* Actions */}
                      <button
                        onClick={() =>
                          downloadEstimatePdf({
                            ...est,
                            userName: session?.user?.name || undefined,
                            userEmail: session?.user?.email || undefined,
                            photoCount: est.photos.length,
                          })
                        }
                        className="rounded-full bg-[color:var(--foreground)] px-5 py-2 text-xs font-bold text-[color:var(--background)] hover:opacity-90 active:scale-95 transition-all"
                      >
                        Download PDF
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
  );
}
