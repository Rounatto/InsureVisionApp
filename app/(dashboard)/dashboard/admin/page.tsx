'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

type AdminUser = {
  id: string;
  name: string | null;
  email: string;
  emailVerified: boolean;
  estimateCount: number;
  isAdmin: boolean;
  banned: boolean;
};

type AdminStats = {
  totalUsers: number;
  verifiedUsers: number;
  unverifiedUsers: number;
  totalEstimates: number;
  recentSignups: number;
};

export default function AdminPage() {
  const { data: session, status } = useSession();
  const canAccessAdmin = Boolean(session?.user?.isAdmin);
  const [expandedActionsUserEmail, setExpandedActionsUserEmail] = useState<string | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  useEffect(() => {
    if (status !== 'authenticated' || !canAccessAdmin) return;

    const loadAdminData = async () => {
      setLoadingData(true);
      setLoadError('');

      try {
        const [statsRes, usersRes] = await Promise.all([
          fetch('/api/admin/stats', { cache: 'no-store' }),
          fetch('/api/admin/users?page=1', { cache: 'no-store' }),
        ]);

        if (!statsRes.ok || !usersRes.ok) {
          setLoadError('Failed to load admin data.');
          return;
        }

        const statsData = (await statsRes.json()) as AdminStats;
        const usersData = (await usersRes.json()) as { users?: AdminUser[] };

        setStats(statsData);
        setUsers(Array.isArray(usersData.users) ? usersData.users : []);
      } catch {
        setLoadError('Failed to load admin data.');
      } finally {
        setLoadingData(false);
      }
    };

    void loadAdminData();
  }, [status, canAccessAdmin]);

  const roleLabel = (user: AdminUser) => {
    if (user.isAdmin) return 'Admin';
    return 'Agent';
  };

  const statusLabel = (user: AdminUser) => {
    if (user.banned) return 'Suspended';
    if (!user.emailVerified) return 'Pending';
    return 'Active';
  };

  const getMetricValue = (value: number) => {
    if (loadingData && !stats) return '...';
    return value.toLocaleString();
  };

  const getHealthValue = () => {
    if (!stats) {
      if (loadingData) return '...';
      return '0%';
    }

    const totalUsers = Math.max(1, stats.totalUsers);
    const healthValue = Math.min(100, Math.round((stats.verifiedUsers / totalUsers) * 100));
    return `${healthValue}%`;
  };

  const getStatusBadgeClass = (user: AdminUser) => {
    if (user.banned) return 'bg-red-500/10 text-red-500';
    if (!user.emailVerified) return 'bg-yellow-500/10 text-yellow-500';
    return 'bg-green-500/10 text-green-500';
  };

  const toggleUserActions = (email: string) => {
    setExpandedActionsUserEmail((previousEmail) => {
      if (previousEmail === email) {
        return null;
      }

      return email;
    });
  };

  const getUserName = (user: AdminUser) => {
    if (!user.name) {
      return 'Unknown';
    }

    return user.name;
  };

  const handleDeleteUser = async (user: AdminUser) => {
    setActionError('');
    setActionSuccess('');

    const confirmDelete = window.confirm(
      `Delete account for ${user.email}? This action cannot be undone.`
    );

    if (!confirmDelete) {
      return;
    }

    setBusyUserId(user.id);

    try {
      const res = await fetch(
        `/api/admin/users?id=${encodeURIComponent(user.id)}`,
        { method: 'DELETE' }
      );

      const data = (await res.json().catch(() => ({}))) as {
        message?: string;
      };

      if (!res.ok) {
        setActionError(data.message || 'Failed to delete user.');
        return;
      }

      setUsers((previousUsers) =>
        previousUsers.filter((currentUser) => currentUser.id !== user.id)
      );

      setStats((previousStats) => {
        if (!previousStats) {
          return previousStats;
        }

        const updatedTotalUsers = Math.max(0, previousStats.totalUsers - 1);
        const updatedVerifiedUsers = user.emailVerified
          ? Math.max(0, previousStats.verifiedUsers - 1)
          : previousStats.verifiedUsers;
        const updatedUnverifiedUsers = user.emailVerified
          ? previousStats.unverifiedUsers
          : Math.max(0, previousStats.unverifiedUsers - 1);

        return {
          ...previousStats,
          totalUsers: updatedTotalUsers,
          verifiedUsers: updatedVerifiedUsers,
          unverifiedUsers: updatedUnverifiedUsers,
        };
      });

      setExpandedActionsUserEmail(null);
      setActionSuccess('User deleted successfully.');
    } catch {
      setActionError('Failed to delete user.');
    } finally {
      setBusyUserId(null);
    }
  };

  const shownUsers = users;

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
            className="inline-flex rounded-xl border border-[color:var(--border)] px-4 py-2 text-sm font-medium text-[color:var(--foreground)] transition-colors hover:bg-[color:var(--muted)]"
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
              <p className="text-xs text-[color:var(--muted-foreground)]">Total Users</p>
              <p className="mt-2 text-2xl font-bold text-[color:var(--foreground)]">
                {stats ? stats.totalUsers.toLocaleString() : getMetricValue(0)}
              </p>
            </div>
            <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-5">
              <p className="text-xs text-[color:var(--muted-foreground)]">Active Sessions</p>
              <p className="mt-2 text-2xl font-bold text-[color:var(--foreground)]">
                {stats ? stats.verifiedUsers.toLocaleString() : getMetricValue(0)}
              </p>
            </div>
            <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-5">
              <p className="text-xs text-[color:var(--muted-foreground)]">Open Reports</p>
              <p className="mt-2 text-2xl font-bold text-[color:var(--foreground)]">
                {stats ? stats.unverifiedUsers.toLocaleString() : getMetricValue(0)}
              </p>
            </div>
            <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-5">
              <p className="text-xs text-[color:var(--muted-foreground)]">System Health</p>
              <p className="mt-2 text-2xl font-bold text-[color:var(--foreground)]">
                {stats ? getHealthValue() : getMetricValue(0)}
              </p>
            </div>
          </div>

          {loadError && (
            <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-500">
              {loadError}
            </div>
          )}

          {actionError && (
            <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-500">
              {actionError}
            </div>
          )}

          {actionSuccess && (
            <div className="mb-4 rounded-2xl border border-green-500/20 bg-green-500/5 p-4 text-sm text-green-500">
              {actionSuccess}
            </div>
          )}

          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[color:var(--foreground)]">
                Recent User Activity
              </h2>
              <button className="rounded-xl border border-[color:var(--border)] px-4 py-2 text-xs font-medium text-[color:var(--foreground)] transition-colors hover:bg-[color:var(--muted)]">
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
                  {shownUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="rounded-xl bg-[color:var(--background)] text-sm text-[color:var(--foreground)]"
                    >
                      <td className="px-3 py-3 font-medium">{getUserName(user)}</td>
                      <td className="px-3 py-3 text-[color:var(--muted-foreground)]">{user.email}</td>
                      <td className="px-3 py-3">{roleLabel(user)}</td>
                      <td className="px-3 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusBadgeClass(user)}`}
                        >
                          {statusLabel(user)}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span className="rounded-lg border border-[color:var(--border)] px-3 py-1.5 text-xs font-medium text-[color:var(--foreground)]">
                          {user.estimateCount} Estimations
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="relative inline-block">
                          <button
                            type="button"
                            onClick={() => toggleUserActions(user.email)}
                            className="rounded-lg border border-[color:var(--border)] px-3 py-1.5 text-xs font-medium transition-colors hover:bg-[color:var(--muted)]"
                          >
                            View
                          </button>

                          {expandedActionsUserEmail === user.email && (
                            <div className="absolute right-0 z-20 mt-2 w-40 rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] p-2 shadow-xl">
                              <button
                                type="button"
                                className="mb-1 w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-amber-500 transition-colors hover:bg-amber-500/10"
                              >
                                Ban
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleDeleteUser(user)}
                                disabled={busyUserId === user.id}
                                className="w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-red-500 transition-colors hover:bg-red-500/10"
                              >
                                {busyUserId === user.id ? 'Deleting...' : 'Delete'}
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {shownUsers.length === 0 && !loadingData && (
                    <tr>
                      <td colSpan={6} className="px-3 py-6 text-center text-sm text-[color:var(--muted-foreground)]">
                        No admin data available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
