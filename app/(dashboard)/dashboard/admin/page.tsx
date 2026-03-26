"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { isAdminEmail } from "@/lib/admin";

export default function AdminPage() {
  const { data: session, status } = useSession();
  const canAccessAdmin = isAdminEmail(session?.user?.email);

  const recentUsers = [
    { name: "Rayan M.", email: "rayan@example.com", role: "Admin", status: "Active" },
    { name: "Sara B.", email: "sara@example.com", role: "Manager", status: "Active" },
    { name: "Youssef K.", email: "youssef@example.com", role: "Agent", status: "Pending" },
    { name: "Lina T.", email: "lina@example.com", role: "Agent", status: "Suspended" },
  ];

  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      {status === "loading" && (
        <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-6 text-sm text-[color:var(--muted-foreground)]">
          Checking access...
        </div>
      )}

      {status !== "loading" && !canAccessAdmin && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
          <h1 className="mb-2 text-2xl font-bold text-[color:var(--foreground)]">Access denied</h1>
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

      {status !== "loading" && canAccessAdmin && (
        <>
      <div className="mb-12">
        <h1 className="mb-3 text-4xl font-bold text-[color:var(--foreground)]">Admin Panel</h1>
        <p className="text-sm text-[color:var(--muted-foreground)]">
          Frontend preview for admin dashboard controls and monitoring.
        </p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-5">
          <p className="text-xs text-[color:var(--muted-foreground)]">Total Users</p>
          <p className="mt-2 text-2xl font-bold text-[color:var(--foreground)]">1,284</p>
        </div>
        <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-5">
          <p className="text-xs text-[color:var(--muted-foreground)]">Active Sessions</p>
          <p className="mt-2 text-2xl font-bold text-[color:var(--foreground)]">312</p>
        </div>
        <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-5">
          <p className="text-xs text-[color:var(--muted-foreground)]">Open Reports</p>
          <p className="mt-2 text-2xl font-bold text-[color:var(--foreground)]">27</p>
        </div>
        <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-5">
          <p className="text-xs text-[color:var(--muted-foreground)]">System Health</p>
          <p className="mt-2 text-2xl font-bold text-[color:var(--foreground)]">98%</p>
        </div>
      </div>

      <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[color:var(--foreground)]">Recent User Activity</h2>
          <button className="rounded-xl border border-[color:var(--border)] px-4 py-2 text-xs font-medium text-[color:var(--foreground)] hover:bg-[color:var(--muted)] transition-colors">
            Export
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-separate border-spacing-y-2">
            <thead>
              <tr className="text-left text-xs text-[color:var(--muted-foreground)]">
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">Email</th>
                <th className="px-3 py-2 font-medium">Role</th>
                <th className="px-3 py-2 font-medium">Status</th>
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
                  <td className="px-3 py-3 text-[color:var(--muted-foreground)]">{user.email}</td>
                  <td className="px-3 py-3">{user.role}</td>
                  <td className="px-3 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        user.status === "Active"
                          ? "bg-green-500/10 text-green-500"
                          : user.status === "Pending"
                            ? "bg-yellow-500/10 text-yellow-500"
                            : "bg-red-500/10 text-red-500"
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <button className="rounded-lg border border-[color:var(--border)] px-3 py-1.5 text-xs font-medium hover:bg-[color:var(--muted)] transition-colors">
                      View
                    </button>
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
