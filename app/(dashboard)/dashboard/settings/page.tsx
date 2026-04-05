"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { NETWORK_ERROR_MESSAGE } from "@/lib/constants";

const CARD_CLASS = "rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-6";
const SECTION_TITLE_CLASS = "text-lg font-semibold text-[color:var(--foreground)] mb-4";

export default function SettingsPage() {
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setDeleteError("");

    try {
      const res = await fetch("/api/auth/delete-account", { method: "DELETE" });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setDeleteError(data.error || data.message || "Failed to delete account");
        setDeleting(false);
        return;
      }

      await signOut({ callbackUrl: "/login" });
    } catch {
      setDeleteError(NETWORK_ERROR_MESSAGE);
      setDeleting(false);
    }
  };

  return (
    <>
      <main className="mx-auto max-w-5xl px-6 py-16">
        <div className="mb-12">
          <h1 className="mb-3 text-4xl font-bold text-[color:var(--foreground)]">
            Settings
          </h1>
          <p className="text-sm text-[color:var(--muted-foreground)]">
            Manage your application preferences and account actions.
          </p>
        </div>

        <div className={CARD_CLASS}>
          <h2 className={SECTION_TITLE_CLASS}>Data & Privacy</h2>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full rounded-xl border border-red-500/20 px-4 py-3 text-left text-sm font-medium text-red-500 transition-colors hover:bg-red-500/10"
          >
            <div className="flex items-center justify-between">
              <span>Delete Account</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </div>
          </button>
        </div>
      </main>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-bold text-[color:var(--foreground)]">
              Delete Account
            </h3>
            <p className="mb-6 text-sm text-[color:var(--muted-foreground)]">
              Are you sure you want to delete your account? This action cannot be undone.
            </p>
            {deleteError && <p className="mb-4 text-[11px] text-red-500">{deleteError}</p>}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteError("");
                }}
                disabled={deleting}
                className="rounded-full border border-[color:var(--border)] px-5 py-2.5 text-sm font-medium text-[color:var(--foreground)] transition-colors hover:bg-[color:var(--muted)] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="rounded-full bg-red-500 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Confirm Deletion"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
