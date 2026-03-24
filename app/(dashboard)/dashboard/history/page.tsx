'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { downloadEstimatePdf } from '@/lib/generatePdf';
import { NETWORK_ERROR_MESSAGE } from '@/lib/constants';

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
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEstimates() {
      try {
        const res = await fetch('/api/estimates');
        if (!res.ok) {
          setError('Failed to load history.');
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

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-[color:var(--foreground)] mb-3">
          Estimation History
        </h1>
        <p className="text-sm text-[color:var(--muted-foreground)] max-w-md mx-auto">
          View all your past damage estimates.
        </p>
      </div>

      {loading && (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[color:var(--foreground)] border-t-transparent" />
        </div>
      )}

      {error && <p className="text-center text-sm text-red-500">{error}</p>}

      {!loading && !error && estimates.length === 0 && (
        <div className="text-center py-20">
          <p className="text-sm text-[color:var(--muted-foreground)] mb-4">
            No estimates yet.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="rounded-full bg-[color:var(--foreground)] px-6 py-2.5 text-sm font-bold text-[color:var(--background)] hover:opacity-90 active:scale-95 transition-all"
          >
            Create Your First Estimate
          </button>
        </div>
      )}

      {!loading && estimates.length > 0 && (
        <div className="space-y-4">
          {estimates.map((est) => {
            const expanded = expandedId === est.id;
            const date = new Date(est.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            });

            return (
              <div
                key={est.id}
                className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] overflow-hidden"
              >
                {/* Collapsed header — always visible */}
                <button
                  onClick={() => toggle(est.id)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-[color:var(--muted)]/30 transition-colors"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <span className="text-xs font-mono text-[color:var(--muted-foreground)]">
                      {est.id}
                    </span>
                    <span className="text-xs text-[color:var(--muted-foreground)] hidden sm:inline">
                      {date}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-[color:var(--foreground)]">
                      ${est.totalCost.toLocaleString()}
                    </span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className={`h-4 w-4 text-[color:var(--muted-foreground)] transition-transform ${expanded ? 'rotate-180' : ''}`}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                      />
                    </svg>
                  </div>
                </button>

                {/* Expanded details */}
                {expanded && (
                  <div className="px-5 pb-5 border-t border-[color:var(--border)]">
                    <p className="text-xs text-[color:var(--muted-foreground)] mt-4 mb-4 sm:hidden">
                      {date}
                    </p>
                    <p className="text-sm text-[color:var(--muted-foreground)] mb-4">
                      {est.summary}
                    </p>

                    {/* Parts */}
                    <div className="space-y-2 mb-4">
                      {est.parts.map((part, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between py-1.5"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-block h-2 w-2 rounded-full ${
                                part.severity === 'High'
                                  ? 'bg-red-500'
                                  : part.severity === 'Medium'
                                    ? 'bg-yellow-500'
                                    : 'bg-green-500'
                              }`}
                            />
                            <span className="text-sm text-[color:var(--foreground)]">
                              {part.name}
                            </span>
                            <span className="text-xs text-[color:var(--muted-foreground)]">
                              ({part.severity})
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
                        {est.photos.length} photo
                        {est.photos.length > 1 ? 's' : ''} uploaded
                      </p>
                    )}

                    {/* Actions */}
                    <button
                      onClick={() =>
                        downloadEstimatePdf({
                          ...est,
                          photoUrls: est.photos,
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
