"use client";

import { useRef, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { NETWORK_ERROR_MESSAGE } from "@/lib/constants";
import { useClickOutside } from "@/hooks/useClickOutside";
import { forceClientSignOut } from "@/lib/client-signout";

export default function SettingsPage() {
  const { language, setLanguage, t } = useLanguage();
  const languageRef = useRef<HTMLDivElement>(null);

  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [downloadingData, setDownloadingData] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const [languageOpen, setLanguageOpen] = useState(false);

  const languageOptions: { value: "en" | "fr" | "es" | "de"; label: string }[] = [
    { value: "en", label: "English" },
    { value: "fr", label: "Français" },
    { value: "es", label: "Español" },
    { value: "de", label: "Deutsch" },
  ];

  const selectedLanguage = languageOptions.find((opt) => opt.value === language)?.label || "English";

  useClickOutside(languageRef, () => setLanguageOpen(false));

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
      const res = await fetch("/api/auth/delete-account", { method: "DELETE" });

      if (!res.ok) {
        const data = await res.json();
        setDeleteError(data.message || "Failed to delete account.");
        setDeleting(false);
        return;
      }

      await forceClientSignOut("/login");
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
                <div className="relative" ref={languageRef}>
                  <button
                    type="button"
                    onClick={() => setLanguageOpen((prev) => !prev)}
                    className="flex w-full items-center justify-between rounded-xl border border-[color:var(--border)] bg-[color:var(--background)] px-4 py-2.5 text-left text-sm text-[color:var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[color:var(--foreground)]/20"
                    aria-haspopup="listbox"
                    aria-expanded={languageOpen}
                  >
                    <span>{selectedLanguage}</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className={`h-4 w-4 text-[color:var(--muted-foreground)] transition-transform ${languageOpen ? "rotate-180" : ""}`}
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.51a.75.75 0 01-1.08 0l-4.25-4.51a.75.75 0 01.02-1.06z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>

                  {languageOpen && (
                    <div className="absolute z-20 mt-2 w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] p-1 shadow-lg">
                      <ul role="listbox" className="space-y-1">
                        {languageOptions.map((option) => {
                          const isSelected = language === option.value;
                          return (
                            <li key={option.value}>
                              <button
                                type="button"
                                onClick={() => {
                                  setLanguage(option.value);
                                  setLanguageOpen(false);
                                }}
                                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                                  isSelected
                                    ? "bg-[color:var(--foreground)] text-[color:var(--background)]"
                                    : "text-[color:var(--foreground)] hover:bg-[color:var(--muted)]"
                                }`}
                              >
                                <span>{option.label}</span>
                                {isSelected && (
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                    className="h-4 w-4"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M16.704 5.29a1 1 0 010 1.414l-7.2 7.2a1 1 0 01-1.414 0l-3.2-3.2a1 1 0 111.414-1.414l2.493 2.493 6.493-6.493a1 1 0 011.414 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                )}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>
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
                disabled={deleting || deleteConfirmText !== "DELETE"}
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