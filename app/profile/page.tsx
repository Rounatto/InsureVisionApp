"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import Navbar from "@/components/Navbar";
import UserAvatar from "@/components/UserAvatar";

export default function ProfilePage() {
  const router = useRouter();
  const { data: session } = useSession();

  // Editable fields
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Seed from session
  useEffect(() => {
    if (session?.user?.name) setName(session.user.name);
  }, [session]);

  const handleSaveProfile = async () => {
    setSaving(true);
    // TODO: API call to update profile
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setDeleteError("");

    try {
      const res = await fetch("/api/auth/delete-account", { method: "DELETE" });

      if (!res.ok) {
        const data = await res.json();
        setDeleteError(data.error || "Failed to delete account");
        setDeleting(false);
        return;
      }

      // Account deleted — sign out and redirect
      await signOut({ callbackUrl: "/login" });
    } catch {
      setDeleteError("Unable to connect to the server. Please try again.");
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[color:var(--background)] text-[color:var(--foreground)]">

      <Navbar />

      {/* ─── Main Content ─────────────────────────────────────── */}
      <main className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="text-3xl font-bold text-[color:var(--foreground)] mb-10">My Profile</h1>

        {/* ─── User Info ──────────────────────────────────────── */}
        <section className="mb-8 pb-8 border-b border-[color:var(--border)]">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[color:var(--muted-foreground)] mb-6">
            Personal Information
          </h2>

          {/* Avatar + info header */}
          <div className="flex items-center gap-4 mb-8">
            <UserAvatar name={session?.user?.name} size="h-14 w-14" textSize="text-xl" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[color:var(--foreground)]">{session?.user?.name || "User"}</p>
              <p className="text-xs text-[color:var(--muted-foreground)]">{session?.user?.email || "—"}</p>
            </div>
          </div>

          {/* Fields grid */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-5 mb-6">
            <div>
              <p className="text-xs text-[color:var(--muted-foreground)] mb-1.5">Full Name</p>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-[color:var(--border)] bg-transparent px-3 py-2 text-sm text-[color:var(--foreground)] outline-none focus:border-[color:var(--foreground)] transition-colors"
              />
            </div>

            <div>
              <p className="text-xs text-[color:var(--muted-foreground)] mb-1.5">Email Address</p>
              <p className="text-sm text-[color:var(--foreground)] py-2">{session?.user?.email || "—"}</p>
            </div>

            <div>
              <p className="text-xs text-[color:var(--muted-foreground)] mb-1.5">Member Since</p>
              <p className="text-sm text-[color:var(--foreground)] py-2">February 2026</p>
            </div>
          </div>

          {/* Save */}
          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="rounded-full bg-[color:var(--foreground)] px-6 py-2.5 text-sm font-bold text-[color:var(--background)] hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </section>

        {/* ─── Security ───────────────────────────────────────── */}
        <section className="mb-8 pb-8 border-b border-[color:var(--border)]">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[color:var(--muted-foreground)] mb-6">
            Security
          </h2>

          {/* Change password */}
          <button
            onClick={() => router.push("/forgot-password")}
            className="flex w-full items-center justify-between py-3 hover:opacity-70 transition-opacity"
          >
            <div className="flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5 text-[color:var(--muted-foreground)]">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
              <div className="text-left">
                <p className="text-sm font-medium text-[color:var(--foreground)]">Change Password</p>
                <p className="text-xs text-[color:var(--muted-foreground)]">Update your password</p>
              </div>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4 text-[color:var(--muted-foreground)]">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>

          {/* Connected accounts */}
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <svg viewBox="0 0 24 24" className="h-5 w-5">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              <div className="text-left">
                <p className="text-sm font-medium text-[color:var(--foreground)]">Google</p>
                <p className="text-xs text-[color:var(--muted-foreground)]">Sign in with Google</p>
              </div>
            </div>
            <span className="text-xs font-medium text-green-600">Connected</span>
          </div>
        </section>

        {/* ─── Activity & Stats ────────────────────────────────── */}
        <section className="mb-8 pb-8 border-b border-[color:var(--border)]">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[color:var(--muted-foreground)] mb-6">
            Activity & Stats
          </h2>
          <div className="flex gap-10 mb-6">
            <div>
              <p className="text-3xl font-bold text-[color:var(--foreground)]">0</p>
              <p className="text-xs text-[color:var(--muted-foreground)] mt-1">Estimates Submitted</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-[color:var(--foreground)]">0</p>
              <p className="text-xs text-[color:var(--muted-foreground)] mt-1">Photos Uploaded</p>
            </div>
          </div>

          <p className="text-sm font-medium text-[color:var(--foreground)] mb-3">Recent Activity</p>
          <div className="flex flex-col items-center py-6 text-[color:var(--muted-foreground)]">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-8 w-8 mb-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm">No activity yet</p>
            <p className="text-xs mt-1">Your estimation history will appear here</p>
          </div>
        </section>

        {/* ─── Delete Account ──────────────────────────────────── */}
        <section className="mb-16">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-500">Delete Account</p>
              <p className="text-xs text-[color:var(--muted-foreground)] mt-1">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              {deleteError && (
                <p className="text-[11px] text-red-500 mt-2">{deleteError}</p>
              )}
            </div>
            <button
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="shrink-0 rounded-full border border-red-500 px-5 py-2 text-sm font-medium text-red-500 hover:bg-red-500 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deleting ? "Deleting…" : "Delete"}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
