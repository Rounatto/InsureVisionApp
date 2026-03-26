"use client";

import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function SettingsPage() {
  const { language, setLanguage, t } = useLanguage();
  const [notifications, setNotifications] = useState(true);
  const [emailUpdates, setEmailUpdates] = useState(false);

  return (
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
        {/* Notifications Section */}
        <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-6">
          <h2 className="text-lg font-semibold text-[color:var(--foreground)] mb-4">
            {t("notificationsSection")}
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[color:var(--foreground)]">
                  {t("pushNotifications")}
                </p>
                <p className="text-xs text-[color:var(--muted-foreground)]">
                  {t("pushNotificationsDesc")}
                </p>
              </div>
              <button
                onClick={() => setNotifications(!notifications)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifications ? "bg-[color:var(--foreground)]" : "bg-[color:var(--muted)]"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notifications ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[color:var(--foreground)]">
                  {t("emailUpdates")}
                </p>
                <p className="text-xs text-[color:var(--muted-foreground)]">
                  {t("emailUpdatesDesc")}
                </p>
              </div>
              <button
                onClick={() => setEmailUpdates(!emailUpdates)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  emailUpdates ? "bg-[color:var(--foreground)]" : "bg-[color:var(--muted)]"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    emailUpdates ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

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
                onChange={(e) => setLanguage(e.target.value as any)}
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

        {/* Data & Privacy Section */}
        <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-6">
          <h2 className="text-lg font-semibold text-[color:var(--foreground)] mb-4">
            {t("dataPrivacy")}
          </h2>
          
          <div className="space-y-3">
            <button className="w-full rounded-xl border border-[color:var(--border)] px-4 py-3 text-left text-sm font-medium text-[color:var(--foreground)] hover:bg-[color:var(--muted)]/50 transition-colors">
              <div className="flex items-center justify-between">
                <span>{t("downloadYourData")}</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
              </div>
            </button>
            
            <button className="w-full rounded-xl border border-red-500/20 px-4 py-3 text-left text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors">
              <div className="flex items-center justify-between">
                <span>{t("deleteAllData")}</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              </div>
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}