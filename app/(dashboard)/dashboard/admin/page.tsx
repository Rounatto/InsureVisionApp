'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

export default function AdminPage() {
  const { data: session, status } = useSession();
  const canAccessAdmin = Boolean(session?.user?.isAdmin);
  const [expandedActionsUserEmail, setExpandedActionsUserEmail] = useState<string | null>(null);
  const [expandedEstimationsUserEmail, setExpandedEstimationsUserEmail] = useState<string | null>(null);

  const recentUsers = [
    {
      name: 'Rayan M.',
      email: 'rayan@example.com',
      role: 'Admin',
      status: 'Active',
      estimations: [
        {
          id: 'EST-1041',
          vehicle: 'BMW X5',
          date: '2026-03-24',
          amount: '$1,950',
          status: 'Approved',
        },
        {
          id: 'EST-1032',
          vehicle: 'Audi A4',
          date: '2026-03-20',
          amount: '$1,120',
          status: 'Pending',
        },
      ],
    },
    {
      name: 'Sara B.',
      email: 'sara@example.com',
      role: 'Manager',
      status: 'Active',
      estimations: [
        {
          id: 'EST-1028',
          vehicle: 'Mercedes CLA',
          date: '2026-03-18',
          amount: '$2,340',
          status: 'Approved',
        },
      ],
    },
    {
      name: 'Youssef K.',
      email: 'youssef@example.com',
      role: 'Agent',
      status: 'Pending',
      estimations: [
        {
          id: 'EST-1019',
          vehicle: 'Peugeot 3008',
          date: '2026-03-11',
          amount: '$890',
          status: 'Review',
        },
        {
          id: 'EST-1014',
          vehicle: 'Renault Clio',
          date: '2026-03-07',
          amount: '$640',
          status: 'Rejected',
        },
        {
          id: 'EST-1008',
          vehicle: 'VW Golf',
          date: '2026-03-02',
          amount: '$1,380',
          status: 'Approved',
        },
      ],
    },
    {
      name: 'Lina T.',
      email: 'lina@example.com',
      role: 'Agent',
      status: 'Suspended',
      estimations: [
        {
          id: 'EST-0996',
          vehicle: 'Ford Fiesta',
          date: '2026-02-21',
          amount: '$520',
          status: 'Rejected',
        },
      ],
    },
  ];

  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      {status === 'loading' && (
        <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-6 text-sm text-[color:var(--muted-foreground)]">
          Checking access...
        </div>
      )}

      {status !== 'loading' && !canAccessAdmin && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
          <h1 className="mb-2 text-2xl font-bold text-[color:var(--foreground)]">
            Access denied
          </h1>
          <p className="mb-4 text-sm text-[color:var(--muted-foreground)]">
            Your account is not allowlisted for the admin page.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex rounded-xl border border-[color:var(--border)] px-4 py-2 text-sm font-medium text-[color:var(--foreground)] hover:bg-[color:var(--muted)] transition-colors"
          >
            Back to dashboard
          </Link>
        </div>
      )}

      {status !== 'loading' && canAccessAdmin && (
        <>
          <div className="mb-12">
            <h1 className="mb-3 text-4xl font-bold text-[color:var(--foreground)]">
              Admin Panel
            </h1>
            <p className="text-sm text-[color:var(--muted-foreground)]">
              Frontend preview for admin dashboard controls and monitoring.
            </p>
          </div>

          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-5">
              <p className="text-xs text-[color:var(--muted-foreground)]">
                Total Users
              </p>
              <p className="mt-2 text-2xl font-bold text-[color:var(--foreground)]">
                1,284
              </p>
            </div>
            <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-5">
              <p className="text-xs text-[color:var(--muted-foreground)]">
                Active Sessions
              </p>
              <p className="mt-2 text-2xl font-bold text-[color:var(--foreground)]">
                312
              </p>
            </div>
            <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-5">
              <p className="text-xs text-[color:var(--muted-foreground)]">
                Open Reports
              </p>
              <p className="mt-2 text-2xl font-bold text-[color:var(--foreground)]">
                27
              </p>
            </div>
            <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-5">
              <p className="text-xs text-[color:var(--muted-foreground)]">
                System Health
              </p>
              <p className="mt-2 text-2xl font-bold text-[color:var(--foreground)]">
                98%
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[color:var(--foreground)]">
                Recent User Activity
              </h2>
              <button className="rounded-xl border border-[color:var(--border)] px-4 py-2 text-xs font-medium text-[color:var(--foreground)] hover:bg-[color:var(--muted)] transition-colors">
                Export
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[840px] border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-left text-xs text-[color:var(--muted-foreground)]">
                    <th className="px-3 py-2 font-medium">Name</th>
                    <th className="px-3 py-2 font-medium">Email</th>
                    <th className="px-3 py-2 font-medium">Role</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2 font-medium">Estimations</th>
                    <th className="px-3 py-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentUsers.map((user) => (
                    <tr
                      key={user.email}
                      className="rounded-xl bg-[color:var(--background)] text-sm text-[color:var(--foreground)]"
                    >
                      <td className="px-3 py-3 font-medium">{user.name}</td>
                      <td className="px-3 py-3 text-[color:var(--muted-foreground)]">
                        {user.email}
                      </td>
                      <td className="px-3 py-3">{user.role}</td>
                      <td className="px-3 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            user.status === 'Active'
                              ? 'bg-green-500/10 text-green-500'
                              : user.status === 'Pending'
                                ? 'bg-yellow-500/10 text-yellow-500'
                                : 'bg-red-500/10 text-red-500'
                          }`}
                        >
                          {user.status}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="relative inline-block">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedEstimationsUserEmail((prev) =>
                                prev === user.email ? null : user.email
                              )
                            }
                            className="rounded-lg border border-[color:var(--border)] px-3 py-1.5 text-xs font-medium hover:bg-[color:var(--muted)] transition-colors"
                          >
                            {user.estimations.length} estimations
                          </button>

                          {expandedEstimationsUserEmail === user.email && (
                            <div className="absolute right-0 z-20 mt-2 w-[320px] rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] p-3 shadow-xl">
                              <p className="mb-2 text-xs font-semibold text-[color:var(--foreground)]">
                                Estimation details
                              </p>

                              <div className="space-y-2">
                                {user.estimations.map((estimation) => (
                                  <div
                                    key={estimation.id}
                                    className="rounded-lg border border-[color:var(--border)] bg-[color:var(--background)] p-2"
                                  >
                                    <div className="mb-1 flex items-center justify-between gap-2">
                                      <span className="text-xs font-semibold text-[color:var(--foreground)]">
                                        {estimation.id}
                                      </span>
                                      <span className="text-[11px] text-[color:var(--muted-foreground)]">
                                        {estimation.date}
                                      </span>
                                    </div>
                                    <p className="text-xs text-[color:var(--muted-foreground)]">
                                      {estimation.vehicle}
                                    </p>
                                    <div className="mt-1 flex items-center justify-between">
                                      <span className="text-xs font-semibold text-[color:var(--foreground)]">
                                        {estimation.amount}
                                      </span>
                                      <span className="rounded-full bg-[color:var(--muted)] px-2 py-0.5 text-[10px] font-medium text-[color:var(--muted-foreground)]">
                                        {estimation.status}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="relative inline-block">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedActionsUserEmail((prev) =>
                                prev === user.email ? null : user.email
                              )
                            }
                            className="rounded-lg border border-[color:var(--border)] px-3 py-1.5 text-xs font-medium hover:bg-[color:var(--muted)] transition-colors"
                          >
                            View
                          </button>

                          {expandedActionsUserEmail === user.email && (
                            <div className="absolute right-0 z-20 mt-2 w-40 rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] p-2 shadow-xl">
                              <button
                                type="button"
                                className="mb-1 w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-amber-500 hover:bg-amber-500/10 transition-colors"
                              >
                                Ban
                              </button>
                              <button
                                type="button"
                                className="w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-red-500 hover:bg-red-500/10 transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
