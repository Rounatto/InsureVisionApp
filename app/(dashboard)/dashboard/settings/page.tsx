"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { useLanguage } from "@/contexts/LanguageContext";
import { NETWORK_ERROR_MESSAGE } from "@/lib/constants";

export default function SettingsPage() {
  const { language, setLanguage, t } = useLanguage();

  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [downloadingData, setDownloadingData] = useState(false);
  const [downloadError, setDownloadError] = useState("");

  const handleDownloadData = async () => {
    setDownloadingData(true);
    setDownloadError("");

    try {
      const res = await fetch("/api/profile/export");

      if (!res.ok) {
        const data = await res.json();
        setDownloadError(data.message || "Failed to download data.");
        setDownloadingData(false);
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `insurevision-data-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setDownloadError(NETWORK_ERROR_MESSAGE);
    } finally {
      setDownloadingData(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setDeleteError("");

    try {
      const res = await fetch("/api/auth/delete-account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: deletePassword }),
      });

      if (!res.ok) {
        const data = await res.json();
        setDeleteError(data.message || "Failed to delete account.");
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
      <main className="mx-auto max-w-4xl px-6 py-16">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-[color:var(--foreground)] mb-3">
            {t("settingsTitle")}
          </h1>
          <p className="text-sm text-[color:var(--muted-foreground)]">
            {t("managePreferences")}
          </p>
        </div>

        <div className="space-y-6">
          {/* Language Section */}
          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-6">
            <h2 className="text-lg font-semibold text-[color:var(--foreground)] mb-4">
              {t("languageRegion")}
            </h2>

            <div className="space-y-3">
              <label className="block">
                <span className="text-sm font-medium text-[color:var(--foreground)] mb-2 block">
                  {t("displayLanguage")}
                </span>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as "en" | "fr" | "es" | "de")}
                  className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--background)] px-4 py-2.5 text-sm text-[color:var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[color:var(--foreground)]/20"
                >
                  <option value="en">English</option>
                  <option value="fr">Français</option>
                  <option value="es">Español</option>
                  <option value="de">Deutsch</option>
                </select>
              </label>
            </div>
          </div>

          {/* Data & Privacy */}
          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-6">
            <h2 className="text-lg font-semibold text-[color:var(--foreground)] mb-1">
              {t("dataPrivacy")}
            </h2>
            <p className="text-xs text-[color:var(--muted-foreground)] mb-4">
              {t("downloadDataDesc")}
            </p>

            {downloadError && (
              <p className="text-xs text-red-500 mb-3">{downloadError}</p>
            )}

            <button
              onClick={handleDownloadData}
              disabled={downloadingData}
              className="rounded-xl border border-[color:var(--border)] px-5 py-2.5 text-sm font-medium text-[color:var(--foreground)] hover:bg-[color:var(--muted)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {downloadingData ? t("downloading") : t("downloadYourData")}
            </button>
          </div>

          {/* Danger Zone */}
          <div className="rounded-2xl border border-red-500/20 bg-[color:var(--card)] p-6">
            <h2 className="text-lg font-semibold text-red-500 mb-1">
              {t("deleteAccount")}
            </h2>
            <p className="text-xs text-[color:var(--muted-foreground)] mb-4">
              {t("deleteAccountDesc")}
            </p>

            {deleteError && (
              <p className="text-xs text-red-500 mb-3">{deleteError}</p>
            )}

            <button
              onClick={() => {
                setShowDeleteConfirm(true);
                setDeleteConfirmText("");
                setDeletePassword("");
                setDeleteError("");
              }}
              disabled={deleting}
              className="rounded-xl border border-red-500 px-5 py-2.5 text-sm font-medium text-red-500 hover:bg-red-500 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t("deleteAccount")}
            </button>
          </div>
        </div>
      </main>

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-2xl bg-[color:var(--card)] border border-[color:var(--border)] p-6 shadow-xl">
            <h3 className="text-lg font-bold text-[color:var(--foreground)] mb-2">
              {t("deleteAccount")}
            </h3>
            <p className="text-sm text-[color:var(--muted-foreground)] mb-4">
              {t("deleteAccountWarning")}
            </p>

            <label className="block text-xs text-[color:var(--muted-foreground)] mb-2">
              {t("typeDeleteToConfirm")}
            </label>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="w-full rounded-lg border border-[color:var(--border)] bg-transparent px-3 py-2 text-sm text-[color:var(--foreground)] outline-none focus:border-red-500 transition-colors mb-4"
              placeholder="DELETE"
            />

            <label className="block text-xs text-[color:var(--muted-foreground)] mb-2">
              {t("enterPasswordToConfirm")}
            </label>
            <input
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              className="w-full rounded-lg border border-[color:var(--border)] bg-transparent px-3 py-2 text-sm text-[color:var(--foreground)] outline-none focus:border-red-500 transition-colors mb-4"
              placeholder={t("currentPassword")}
            />

            {deleteError && (
              <p className="text-xs text-red-500 mb-4">{deleteError}</p>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteError("");
                }}
                disabled={deleting}
                className="rounded-full px-5 py-2.5 text-sm font-medium text-[color:var(--foreground)] border border-[color:var(--border)] hover:bg-[color:var(--muted)] transition-colors disabled:opacity-50"
              >
                {t("cancelDeletion")}
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting || deleteConfirmText !== "DELETE" || !deletePassword}
                className="rounded-full bg-red-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? t("deleting") : t("confirmDeletion")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}