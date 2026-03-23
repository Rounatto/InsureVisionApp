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
  isAdmin: boolean;
  banned: boolean;
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
  const [deleting, setDeleting] = useState<string | null>(null);
  const [banning, setBanning] = useState<string | null>(null);

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

  const handleDeleteUser = async (userId: string) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this user? This action cannot be undone.'
    );
    if (!confirmed) return;

    setDeleting(userId);
    try {
      const res = await fetch(`/api/admin/users?id=${userId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setUsersData((prev) =>
          prev
            ? {
                ...prev,
                users: prev.users.filter((u) => u.id !== userId),
              }
            : null
        );
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to delete user');
      }
    } catch {
      alert('Error deleting user');
    } finally {
      setDeleting(null);
    }
  };

  const handleBanUser = async (userId: string, currentlyBanned: boolean) => {
    const action = currentlyBanned ? 'unban' : 'ban';

    setBanning(userId);
    try {
      const res = await fetch(
        `/api/admin/users?id=${userId}&action=${action}`,
        {
          method: 'PATCH',
        }
      );

      if (res.ok) {
        setUsersData((prev) =>
          prev
            ? {
                ...prev,
                users: prev.users.map((u) =>
                  u.id === userId ? { ...u, banned: !currentlyBanned } : u
                ),
              }
            : null
        );
      } else {
        const data = await res.json();
        alert(data.message || `Failed to ${action} user`);
      }
    } catch {
      alert(`Error ${action}ing user`);
    } finally {
      setBanning(null);
    }
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
            <p className="text-sm text-[color:var(--muted-foreground)] mb-4">
              Platform overview and user management.
            </p>
            <div className="flex gap-2">
              <Link
                href="/dashboard/admin/messages"
                className="px-4 py-2 rounded-lg border border-[color:var(--border)] text-sm font-medium hover:bg-[color:var(--muted)] transition-colors"
              >
                Banned User Messages
              </Link>
            </div>
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
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2 font-medium">Joined</th>
                    <th className="px-3 py-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingUsers ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-3 py-6 text-center text-sm text-[color:var(--muted-foreground)]"
                      >
                        Loading users…
                      </td>
                    </tr>
                  ) : !usersData?.users.length ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-3 py-6 text-center text-sm text-[color:var(--muted-foreground)]"
                      >
                        No users found.
                      </td>
                    </tr>
                  ) : (
                    usersData.users.map((user) => (
                      <tr
                        key={user.id}
                        className={`rounded-xl text-sm ${
                          user.banned
                            ? 'bg-red-500/5 opacity-60'
                            : 'bg-[color:var(--background)]'
                        } text-[color:var(--foreground)]`}
                      >
                        <td className="px-3 py-3 font-medium">
                          {user.name || '—'}
                        </td>
                        <td className="px-3 py-3 text-[color:var(--muted-foreground)]">
                          {user.email}
                        </td>
                        <td className="px-3 py-3">
                          {user.authProvider}
                          {user.isAdmin && (
                            <span className="ml-2 inline-block rounded-full bg-purple-500/10 px-2 py-0.5 text-xs font-medium text-purple-500">
                              Admin
                            </span>
                          )}
                        </td>
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
                        <td className="px-3 py-3">
                          {user.banned && (
                            <span className="rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-500">
                              Banned
                            </span>
                          )}
                          {!user.banned && (
                            <span className="rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-500">
                              Active
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-[color:var(--muted-foreground)]">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="px-3 py-3">
                          {!user.isAdmin && (
                            <div className="flex flex-wrap items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  handleBanUser(user.id, user.banned)
                                }
                                disabled={
                                  banning === user.id || deleting === user.id
                                }
                                className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                  user.banned
                                    ? 'border-green-500/30 bg-green-500/10 text-green-600 hover:bg-green-500/15'
                                    : 'border-yellow-500/30 bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/15'
                                }`}
                              >
                                {user.banned ? 'Unban' : 'Ban'}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteUser(user.id)}
                                disabled={
                                  banning === user.id || deleting === user.id
                                }
                                className="rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-[11px] font-semibold text-red-600 transition-colors hover:bg-red-500/15 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Delete
                              </button>

                              {(banning === user.id ||
                                deleting === user.id) && (
                                <span className="text-[11px] text-[color:var(--muted-foreground)]">
                                  Processing...
                                </span>
                              )}
                            </div>
                          )}
                          {user.isAdmin && (
                            <span className="inline-flex rounded-full border border-[color:var(--border)] px-2.5 py-1 text-[11px] font-medium text-[color:var(--muted-foreground)]">
                              Protected
                            </span>
                          )}
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
