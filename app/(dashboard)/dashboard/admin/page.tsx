'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useLanguage } from '@/contexts/LanguageContext';

interface Estimate {
  id: string;
  createdAt: string;
  status: string;
  jobId?: string;
}

interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  isBanned: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  estimateCount: number;
  estimates?: Estimate[];
}

interface AdminStats {
  totalUsers: number;
  activeSessions?: number;
  openReports?: number;
  systemHealth?: number;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const { t } = useLanguage();
  const canAccessAdmin = Boolean(session?.user?.isAdmin);

  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedEstimationsUserId, setExpandedEstimationsUserId] = useState<
    string | null
  >(null);
  const [expandedActionsUserId, setExpandedActionsUserId] = useState<
    string | null
  >(null);
  const [userEstimates, setUserEstimates] = useState<Estimate[]>([]);
  const [loadingEstimates, setLoadingEstimates] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (canAccessAdmin) {
      fetchStats();
      fetchUsers();
    }
  }, [canAccessAdmin, page]);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users?page=${page}&limit=10`);
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setUsers(data.users || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserEstimates = async (userId: string) => {
    setLoadingEstimates(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/estimates`);
      if (res.ok) {
        const data = await res.json();
        setUserEstimates(data.estimates || []);
      }
    } catch (err) {
      console.error('Failed to fetch estimates:', err);
    } finally {
      setLoadingEstimates(false);
    }
  };

  const handleBan = async (userId: string, banned: boolean) => {
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/ban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ banned }),
      });
      if (res.ok) {
        setUsers(
          users.map((u) => (u.id === userId ? { ...u, isBanned: banned } : u))
        );
      }
    } catch (err) {
      console.error('Failed to ban/unban:', err);
    } finally {
      setActionLoading(null);
      setExpandedActionsUserId(null);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setUsers(users.filter((u) => u.id !== userId));
      }
    } catch (err) {
      console.error('Failed to delete:', err);
    } finally {
      setActionLoading(null);
      setExpandedActionsUserId(null);
    }
  };

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const res = await fetch(`/api/admin/users/export?format=${format}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `users.${format}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Failed to export:', err);
    }
  };

  const onToggleEstimations = (user: User) => {
    if (expandedEstimationsUserId === user.id) {
      setExpandedEstimationsUserId(null);
    } else {
      setExpandedEstimationsUserId(user.id);
      if (!user.estimates) {
        fetchUserEstimates(user.id);
      }
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      {status === 'loading' && (
        <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-6 text-sm text-[color:var(--muted-foreground)]">
          {t('checkingAccess')}
        </div>
      )}

      {status !== 'loading' && !canAccessAdmin && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
          <h1 className="mb-2 text-2xl font-bold text-[color:var(--foreground)]">
            {t('accessDeniedTitle')}
          </h1>
          <p className="mb-4 text-sm text-[color:var(--muted-foreground)]">
            {t('adminAccessAllowlisted')}
          </p>
          <Link
            href="/dashboard"
            className="inline-flex rounded-xl border border-[color:var(--border)] px-4 py-2 text-sm font-medium text-[color:var(--foreground)] hover:bg-[color:var(--muted)] transition-colors"
          >
            {t('backToDashboard')}
          </Link>
        </div>
      )}

      {status !== 'loading' && canAccessAdmin && (
        <>
          <div className="mb-12">
            <h1 className="mb-3 text-4xl font-bold text-[color:var(--foreground)]">
              {t('adminPanel')}
            </h1>
            <p className="text-sm text-[color:var(--muted-foreground)]">
              {t('adminPanelDesc')}
            </p>
          </div>

          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-5">
              <p className="text-xs text-[color:var(--muted-foreground)]">
                {t('totalUsers')}
              </p>
              <p className="mt-2 text-2xl font-bold text-[color:var(--foreground)]">
                {stats?.totalUsers || '-'}
              </p>
            </div>
            <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-5">
              <p className="text-xs text-[color:var(--muted-foreground)]">
                {t('activeSessions')}
              </p>
              <p className="mt-2 text-2xl font-bold text-[color:var(--foreground)]">
                {stats?.activeSessions || '-'}
              </p>
            </div>
            <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-5">
              <p className="text-xs text-[color:var(--muted-foreground)]">
                {t('openReports')}
              </p>
              <p className="mt-2 text-2xl font-bold text-[color:var(--foreground)]">
                {stats?.openReports || '-'}
              </p>
            </div>
            <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-5">
              <p className="text-xs text-[color:var(--muted-foreground)]">
                {t('systemHealth')}
              </p>
              <p className="mt-2 text-2xl font-bold text-[color:var(--foreground)]">
                {stats?.systemHealth ? `${stats.systemHealth}%` : '-'}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[color:var(--foreground)]">
                Users
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => handleExport('csv')}
                  className="rounded-xl border border-[color:var(--border)] px-4 py-2 text-xs font-medium text-[color:var(--foreground)] hover:bg-[color:var(--muted)] transition-colors"
                >
                  Export CSV
                </button>
                <button
                  onClick={() => handleExport('json')}
                  className="rounded-xl border border-[color:var(--border)] px-4 py-2 text-xs font-medium text-[color:var(--foreground)] hover:bg-[color:var(--muted)] transition-colors"
                >
                  Export JSON
                </button>
              </div>
            </div>

            {error && (
              <div className="mb-4 rounded-xl bg-red-500/10 p-3 text-sm text-red-500">
                {error}
              </div>
            )}

            {loading ? (
              <div className="py-8 text-center text-[color:var(--muted-foreground)]">
                {t('loading')}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[840px] border-separate border-spacing-y-2">
                    <thead>
                      <tr className="text-left text-xs text-[color:var(--muted-foreground)]">
                        <th className="px-3 py-2 font-medium">{t('name')}</th>
                        <th className="px-3 py-2 font-medium">{t('email')}</th>
                        <th className="px-3 py-2 font-medium">Joined</th>
                        <th className="px-3 py-2 font-medium">Status</th>
                        <th className="px-3 py-2 font-medium">Estimates</th>
                        <th className="px-3 py-2 font-medium">
                          {t('actions')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr
                          key={user.id}
                          className="rounded-xl bg-[color:var(--background)] text-sm text-[color:var(--foreground)]"
                        >
                          <td className="px-3 py-3 font-medium">
                            {user.name || '-'}
                          </td>
                          <td className="px-3 py-3 text-[color:var(--muted-foreground)]">
                            {user.email}
                          </td>
                          <td className="px-3 py-3 text-[color:var(--muted-foreground)]">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-3 py-3">
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                                user.isBanned
                                  ? 'bg-red-500/10 text-red-500'
                                  : 'bg-green-500/10 text-green-500'
                              }`}
                            >
                              {user.isBanned ? 'Banned' : 'Active'}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <div className="relative inline-block">
                              <button
                                type="button"
                                onClick={() => onToggleEstimations(user)}
                                className="rounded-lg border border-[color:var(--border)] px-3 py-1.5 text-xs font-medium hover:bg-[color:var(--muted)] transition-colors"
                              >
                                {user.estimateCount || 0} {t('estimations')}
                              </button>

                              {expandedEstimationsUserId === user.id && (
                                <div className="absolute right-0 z-20 mt-2 w-[320px] rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] p-3 shadow-xl">
                                  <p className="mb-2 text-xs font-semibold text-[color:var(--foreground)]">
                                    User Estimates
                                  </p>
                                  {loadingEstimates ? (
                                    <div className="py-4 text-center text-xs text-[color:var(--muted-foreground)]">
                                      {t('loading')}
                                    </div>
                                  ) : userEstimates.length === 0 ? (
                                    <p className="text-xs text-[color:var(--muted-foreground)]">
                                      No estimates
                                    </p>
                                  ) : (
                                    <div className="space-y-2 max-h-64 overflow-y-auto">
                                      {userEstimates.map((est) => (
                                        <div
                                          key={est.id}
                                          className="rounded-lg border border-[color:var(--border)] bg-[color:var(--background)] p-2"
                                        >
                                          <div className="flex items-center justify-between gap-2">
                                            <span className="text-xs font-semibold text-[color:var(--foreground)]">
                                              {est.jobId || est.id.slice(0, 8)}
                                            </span>
                                            <span className="text-[11px] text-[color:var(--muted-foreground)]">
                                              {new Date(
                                                est.createdAt
                                              ).toLocaleDateString()}
                                            </span>
                                          </div>
                                          <span
                                            className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                              est.status === 'completed'
                                                ? 'bg-green-500/10 text-green-500'
                                                : est.status === 'failed'
                                                  ? 'bg-red-500/10 text-red-500'
                                                  : 'bg-yellow-500/10 text-yellow-500'
                                            }`}
                                          >
                                            {est.status}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <div className="relative inline-block">
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedActionsUserId((prev) =>
                                    prev === user.id ? null : user.id
                                  )
                                }
                                disabled={actionLoading === user.id}
                                className="rounded-lg border border-[color:var(--border)] px-3 py-1.5 text-xs font-medium hover:bg-[color:var(--muted)] transition-colors disabled:opacity-50"
                              >
                                {actionLoading === user.id
                                  ? t('loading')
                                  : t('actions')}
                              </button>

                              {expandedActionsUserId === user.id && (
                                <div className="absolute right-0 z-20 mt-2 w-40 rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] p-2 shadow-xl">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleBan(user.id, !user.isBanned)
                                    }
                                    className="mb-1 w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-amber-500 hover:bg-amber-500/10 transition-colors"
                                  >
                                    {user.isBanned ? 'Unban' : 'Ban'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDelete(user.id)}
                                    className="w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-red-500 hover:bg-red-500/10 transition-colors"
                                  >
                                    {t('delete')}
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

                <div className="mt-4 flex items-center justify-between">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="rounded-xl border border-[color:var(--border)] px-4 py-2 text-sm font-medium text-[color:var(--foreground)] hover:bg-[color:var(--muted)] transition-colors disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-[color:var(--muted-foreground)]">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="rounded-xl border border-[color:var(--border)] px-4 py-2 text-sm font-medium text-[color:var(--foreground)] hover:bg-[color:var(--muted)] transition-colors disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </main>
  );
}
