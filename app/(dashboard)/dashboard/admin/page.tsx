'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

interface AdminStats {
  totalUsers: number;
  verifiedUsers: number;
  unverifiedUsers: number;
  totalEstimates: number;
  recentSignups: number;
}

interface AdminUser {
  id: string;
  name: string | null;
  email: string;
  authProvider: 'Google' | 'Email/Password';
  emailVerified: boolean;
  image: string | null;
  createdAt: string;
  estimateCount: number;
}

interface UsersResponse {
  users: AdminUser[];
  total: number;
  page: number;
  totalPages: number;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const canAccessAdmin = session?.user?.isAdmin ?? false;

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [usersData, setUsersData] = useState<UsersResponse | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/stats');
      if (res.ok) setStats(await res.json());
    } catch {
      /* silent */
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (search) params.set('search', search);
      const res = await fetch(`/api/admin/users?${params}`);
      if (res.ok) setUsersData(await res.json());
    } catch {
      /* silent */
    } finally {
      setLoadingUsers(false);
    }
  }, [page, search]);

  useEffect(() => {
    if (canAccessAdmin) {
      fetchStats();
    }
  }, [canAccessAdmin, fetchStats]);

  useEffect(() => {
    if (canAccessAdmin) {
      fetchUsers();
    }
  }, [canAccessAdmin, fetchUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

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
              Platform overview and user management.
            </p>
          </div>

          {/* ── Stats Cards ─────────────────────────────────── */}
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-5">
              <p className="text-xs text-[color:var(--muted-foreground)]">
                Total Users
              </p>
              <p className="mt-2 text-2xl font-bold text-[color:var(--foreground)]">
                {loadingStats ? '…' : (stats?.totalUsers ?? 0).toLocaleString()}
              </p>
            </div>
            <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-5">
              <p className="text-xs text-[color:var(--muted-foreground)]">
                Verified Users
              </p>
              <p className="mt-2 text-2xl font-bold text-[color:var(--foreground)]">
                {loadingStats
                  ? '…'
                  : (stats?.verifiedUsers ?? 0).toLocaleString()}
              </p>
            </div>
            <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-5">
              <p className="text-xs text-[color:var(--muted-foreground)]">
                Total Estimates
              </p>
              <p className="mt-2 text-2xl font-bold text-[color:var(--foreground)]">
                {loadingStats
                  ? '…'
                  : (stats?.totalEstimates ?? 0).toLocaleString()}
              </p>
            </div>
            <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-5">
              <p className="text-xs text-[color:var(--muted-foreground)]">
                Signups (7 days)
              </p>
              <p className="mt-2 text-2xl font-bold text-[color:var(--foreground)]">
                {loadingStats
                  ? '…'
                  : (stats?.recentSignups ?? 0).toLocaleString()}
              </p>
            </div>
          </div>

          {/* ── Users Table ─────────────────────────────────── */}
          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-6">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-semibold text-[color:var(--foreground)]">
                Users
              </h2>
              <form onSubmit={handleSearch} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Search by name or email…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="rounded-xl border border-[color:var(--border)] bg-[color:var(--background)] px-3 py-2 text-xs text-[color:var(--foreground)] placeholder:text-[color:var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-primary/20 w-56"
                />
                <button
                  type="submit"
                  className="rounded-xl border border-[color:var(--border)] px-4 py-2 text-xs font-medium text-[color:var(--foreground)] hover:bg-[color:var(--muted)] transition-colors"
                >
                  Search
                </button>
              </form>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-left text-xs text-[color:var(--muted-foreground)]">
                    <th className="px-3 py-2 font-medium">Name</th>
                    <th className="px-3 py-2 font-medium">Email</th>
                    <th className="px-3 py-2 font-medium">Auth Provider</th>
                    <th className="px-3 py-2 font-medium">Estimates</th>
                    <th className="px-3 py-2 font-medium">Email Verified</th>
                    <th className="px-3 py-2 font-medium">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingUsers ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-3 py-6 text-center text-sm text-[color:var(--muted-foreground)]"
                      >
                        Loading users…
                      </td>
                    </tr>
                  ) : !usersData?.users.length ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-3 py-6 text-center text-sm text-[color:var(--muted-foreground)]"
                      >
                        No users found.
                      </td>
                    </tr>
                  ) : (
                    usersData.users.map((user) => (
                      <tr
                        key={user.id}
                        className="rounded-xl bg-[color:var(--background)] text-sm text-[color:var(--foreground)]"
                      >
                        <td className="px-3 py-3 font-medium">
                          {user.name || '—'}
                        </td>
                        <td className="px-3 py-3 text-[color:var(--muted-foreground)]">
                          {user.email}
                        </td>
                        <td className="px-3 py-3">{user.authProvider}</td>
                        <td className="px-3 py-3">{user.estimateCount}</td>
                        <td className="px-3 py-3">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                              user.emailVerified
                                ? 'bg-green-500/10 text-green-500'
                                : 'bg-yellow-500/10 text-yellow-500'
                            }`}
                          >
                            {user.emailVerified ? 'Verified' : 'Not Verified'}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-[color:var(--muted-foreground)]">
                          {formatDate(user.createdAt)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* ── Pagination ──────────────────────────────── */}
            {usersData && usersData.totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between text-xs text-[color:var(--muted-foreground)]">
                <span>
                  Page {usersData.page} of {usersData.totalPages} (
                  {usersData.total} users)
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="rounded-lg border border-[color:var(--border)] px-3 py-1.5 font-medium hover:bg-[color:var(--muted)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= (usersData?.totalPages ?? 1)}
                    className="rounded-lg border border-[color:var(--border)] px-3 py-1.5 font-medium hover:bg-[color:var(--muted)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </main>
  );
}
