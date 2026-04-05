"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { NETWORK_ERROR_MESSAGE } from "@/lib/constants";
import { downloadEstimatePdf } from "@/lib/client/generatePdf";

interface PredictionSummaryItem {
  photoUrl?: string;
  prediction?: string;
  confidence?: number;
  probabilities?: Record<string, number>;
}

interface CostEstimateSummary {
  model?: string;
  currency?: string;
  total?: number;
  note?: string;
}

interface ParsedSummary {
  confidentPredictions: PredictionSummaryItem[];
  confidenceThreshold?: number;
  costEstimate?: CostEstimateSummary;
}

interface Estimate {
  id: string;
  photos: string[];
  summary: string;
  createdAt: string;
}

function normalizeConfidence(confidence: number): number {
  return confidence > 1 ? confidence / 100 : confidence;
}

function parseSummary(summary: string): ParsedSummary {
  try {
    const parsed = JSON.parse(summary) as unknown;

    if (Array.isArray(parsed)) {
      return {
        confidentPredictions: parsed.filter(
          (item): item is PredictionSummaryItem =>
            Boolean(item) && typeof item === "object"
        ),
      };
    }

    if (parsed && typeof parsed === "object") {
      const record = parsed as {
        confidentPredictions?: unknown;
        confidenceThreshold?: unknown;
        costEstimate?: unknown;
      };

      const confidentPredictions = Array.isArray(record.confidentPredictions)
        ? record.confidentPredictions.filter(
            (item): item is PredictionSummaryItem =>
              Boolean(item) && typeof item === "object"
          )
        : [];

      const confidenceThreshold =
        typeof record.confidenceThreshold === "number"
          ? record.confidenceThreshold
          : undefined;

      const costEstimate =
        record.costEstimate && typeof record.costEstimate === "object"
          ? (record.costEstimate as CostEstimateSummary)
          : undefined;

      return { confidentPredictions, confidenceThreshold, costEstimate };
    }

    return { confidentPredictions: [] };
  } catch {
    return { confidentPredictions: [] };
  }
}

function getConfidenceText(prediction: PredictionSummaryItem): string {
  if (typeof prediction.confidence !== "number") {
    return "";
  }

  const confidenceValue = normalizeConfidence(prediction.confidence);
  return `Confidence: ${Math.round(confidenceValue * 100)}%`;
}

function getPhotoLabel(photoCount: number): string {
  if (photoCount === 1) {
    return "1 photo uploaded";
  }

  return `${photoCount} photos uploaded`;
}

export default function HistoryPage() {
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

  const toggle = (id: string) => {
    setExpandedId((prev) => {
      if (prev === id) {
        return null;
      }

      return id;
    });
  };

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
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m-7-8h8m-8 12h8" />
                </svg>
              </span>
              <p className="text-[11px] uppercase tracking-wide text-[color:var(--muted-foreground)]">
                Output Type
              </p>
              <p className="mt-1 text-lg font-semibold text-[color:var(--foreground)]">
                Model Predictions
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
              const parsedSummary = parseSummary(est.summary);

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
                    </div>
                    <div className="flex items-center gap-3">
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
                      <div className="space-y-2 mb-4">
                        {parsedSummary.confidentPredictions.map((prediction, i) => (
                          <div
                            key={`${est.id}-${i}`}
                            className="rounded-lg border border-[color:var(--border)] px-3 py-2"
                          >
                            <p className="text-[11px] text-[color:var(--muted-foreground)]">
                              Photo {i + 1}
                            </p>
                            <p className="text-sm font-medium text-[color:var(--foreground)]">
                              {prediction.prediction || "Unknown"}
                            </p>
                            <p className="text-[11px] text-[color:var(--muted-foreground)]">
                              {getConfidenceText(prediction)}
                            </p>
                          </div>
                        ))}

                        {parsedSummary.confidentPredictions.length === 0 && (
                          <p className="rounded-lg border border-[color:var(--border)] px-3 py-2 text-sm text-[color:var(--muted-foreground)]">
                            No confident predictions
                            {typeof parsedSummary.confidenceThreshold === "number"
                              ? ` (threshold ${Math.round(parsedSummary.confidenceThreshold * 100)}%)`
                              : ""}
                            .
                          </p>
                        )}
                      </div>

                      {parsedSummary.costEstimate && (
                        <div className="mb-4 rounded-lg border border-[color:var(--border)] px-3 py-2">
                          <p className="text-[11px] text-[color:var(--muted-foreground)]">
                            Cost Estimation Model
                          </p>
                          <p className="text-sm font-medium text-[color:var(--foreground)]">
                            {(parsedSummary.costEstimate.currency ?? "USD")} {(parsedSummary.costEstimate.total ?? 0).toLocaleString()}
                          </p>
                          {parsedSummary.costEstimate.note && (
                            <p className="text-[11px] text-[color:var(--muted-foreground)]">
                              {parsedSummary.costEstimate.note}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Photos */}
                        {est.photos.length > 0 && (
                          <p className="text-xs text-[color:var(--muted-foreground)] mb-4">
                            {getPhotoLabel(est.photos.length)}
                          </p>
                        )}

                      <button
                        onClick={() =>
                          downloadEstimatePdf({
                            id: est.id,
                            confidentPredictions:
                              parsedSummary.confidentPredictions,
                            confidenceThreshold:
                              parsedSummary.confidenceThreshold,
                            costEstimate: parsedSummary.costEstimate,
                            photoUrls: est.photos,
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
