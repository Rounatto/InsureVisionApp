'use client';

import type { ChangeEvent } from 'react';
import { useEffect, useState } from 'react';
import { signOut } from 'next-auth/react';
import { Download, Trash2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Language } from '@/lib/i18n/translations';
import { NETWORK_ERROR_MESSAGE } from '@/lib/constants';

// Shared style constants keep repeated Tailwind strings in one place.
// This improves readability without changing appearance.
const CARD_CLASS =
  'rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-6';
const SECTION_TITLE_CLASS =
  'text-lg font-semibold text-[color:var(--foreground)] mb-4';
const TOGGLE_CLASS_BASE =
  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors';

// Dropdown options mapped to supported language union.
// Labels are intentionally human-readable display names.
const languageOptions: { value: Language; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'Français' },
  { value: 'es', label: 'Español' },
  { value: 'de', label: 'Deutsch' },
];

// Pure helper for toggle track color based on enabled state.
function getToggleTrackClass(enabled: boolean) {
  return `${TOGGLE_CLASS_BASE} ${
    enabled ? 'bg-[color:var(--foreground)]' : 'bg-[color:var(--muted)]'
  }`;
}

// Pure helper for toggle thumb position based on enabled state.
function getToggleThumbClass(enabled: boolean) {
  return `inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
    enabled ? 'translate-x-6' : 'translate-x-1'
  }`;
}

export default function SettingsPage() {
  // `language` and `setLanguage` come from global LanguageContext.
  // `t` maps a translation key to localized text.
  const { language, setLanguage, t } = useLanguage();

  // Local UI state for settings toggles (currently frontend-only toggles).
  const [notifications, setNotifications] = useState(true);
  const [emailUpdates, setEmailUpdates] = useState(false);
  const [preferencesLoading, setPreferencesLoading] = useState(true);
  const [preferencesSaving, setPreferencesSaving] = useState(false);
  const [preferencesError, setPreferencesError] = useState('');
  const [exportingData, setExportingData] = useState(false);
  const [exportDataError, setExportDataError] = useState('');
  const [deletingData, setDeletingData] = useState(false);
  const [deleteDataError, setDeleteDataError] = useState('');

  // Language selection entry-point:
  // changing the select updates context + localStorage via `setLanguage`.
  const handleLanguageChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setLanguage(event.target.value as Language);
  };

  useEffect(() => {
    let isMounted = true;

    const loadPreferences = async () => {
      try {
        const res = await fetch('/api/profile/preferences', { method: 'GET' });

        if (!res.ok) {
          if (isMounted) {
            setPreferencesError('Failed to load notification preferences.');
          }
          return;
        }

        const data = await res.json();
        if (!isMounted) return;

        setNotifications(Boolean(data?.preferences?.notificationsEnabled));
        setEmailUpdates(Boolean(data?.preferences?.emailUpdatesEnabled));
      } catch {
        if (isMounted) {
          setPreferencesError('Failed to load notification preferences.');
        }
      } finally {
        if (isMounted) {
          setPreferencesLoading(false);
        }
      }
    };

    void loadPreferences();

    return () => {
      isMounted = false;
    };
  }, []);

  const persistPreferences = async (
    nextNotifications: boolean,
    nextEmailUpdates: boolean
  ) => {
    setPreferencesSaving(true);
    setPreferencesError('');

    try {
      const res = await fetch('/api/profile/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notificationsEnabled: nextNotifications,
          emailUpdatesEnabled: nextEmailUpdates,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setPreferencesError(
          data.message || 'Failed to save notification preferences.'
        );
        return false;
      }

      return true;
    } catch {
      setPreferencesError(NETWORK_ERROR_MESSAGE);
      return false;
    } finally {
      setPreferencesSaving(false);
    }
  };

  const handleToggleNotifications = async () => {
    if (preferencesLoading || preferencesSaving) return;

    const previous = notifications;
    const next = !previous;
    setNotifications(next);

    const success = await persistPreferences(next, emailUpdates);
    if (!success) {
      setNotifications(previous);
    }
  };

  const handleToggleEmailUpdates = async () => {
    if (preferencesLoading || preferencesSaving) return;

    const previous = emailUpdates;
    const next = !previous;
    setEmailUpdates(next);

    const success = await persistPreferences(notifications, next);
    if (!success) {
      setEmailUpdates(previous);
    }
  };

  const handleDeleteAllData = async () => {
    const confirmed = window.confirm(
      'This will permanently delete your account and all data. Continue?'
    );
    if (!confirmed || deletingData) return;

    setDeletingData(true);
    setDeleteDataError('');

    try {
      const res = await fetch('/api/auth/delete-account', {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setDeleteDataError(data.error || 'Failed to delete account.');
        setDeletingData(false);
        return;
      }

      await signOut({ callbackUrl: '/login' });
    } catch {
      setDeleteDataError(NETWORK_ERROR_MESSAGE);
      setDeletingData(false);
    }
  };

  const handleDownloadData = async () => {
    if (exportingData) return;

    setExportingData(true);
    setExportDataError('');

    try {
      const res = await fetch('/api/profile/export', {
        method: 'GET',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setExportDataError(data.message || 'Failed to export your data.');
        setExportingData(false);
        return;
      }

      const blob = await res.blob();
      const disposition = res.headers.get('content-disposition') || '';
      const filenameMatch = disposition.match(/filename="?([^";]+)"?/i);
      const filename =
        filenameMatch?.[1] || `insurevision-data-${Date.now()}.json`;

      const downloadUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = downloadUrl;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch {
      setExportDataError(NETWORK_ERROR_MESSAGE);
    } finally {
      setExportingData(false);
    }
  };

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-[color:var(--foreground)] mb-3">
          {t('settingsTitle')}
        </h1>
        <p className="text-sm text-[color:var(--muted-foreground)]">
          {t('managePreferences')}
        </p>
      </div>

      <div className="space-y-6">
        {/* Notifications Section */}
        <div className={CARD_CLASS}>
          <h2 className={SECTION_TITLE_CLASS}>{t('notificationsSection')}</h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[color:var(--foreground)]">
                  {t('pushNotifications')}
                </p>
                <p className="text-xs text-[color:var(--muted-foreground)]">
                  {t('pushNotificationsDesc')}
                </p>
              </div>
              <button
                onClick={handleToggleNotifications}
                disabled={preferencesLoading || preferencesSaving}
                className={getToggleTrackClass(notifications)}
              >
                <span className={getToggleThumbClass(notifications)} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[color:var(--foreground)]">
                  {t('emailUpdates')}
                </p>
                <p className="text-xs text-[color:var(--muted-foreground)]">
                  {t('emailUpdatesDesc')}
                </p>
              </div>
              <button
                onClick={handleToggleEmailUpdates}
                disabled={preferencesLoading || preferencesSaving}
                className={getToggleTrackClass(emailUpdates)}
              >
                <span className={getToggleThumbClass(emailUpdates)} />
              </button>
            </div>
            {(preferencesLoading || preferencesSaving) && (
              <p className="text-xs text-[color:var(--muted-foreground)]">
                {preferencesLoading
                  ? 'Loading preferences...'
                  : 'Saving preferences...'}
              </p>
            )}
            {preferencesError && (
              <p className="text-xs text-red-500">{preferencesError}</p>
            )}
          </div>
        </div>

        {/* Language Section */}
        <div className={CARD_CLASS}>
          <h2 className={SECTION_TITLE_CLASS}>{t('languageRegion')}</h2>

          <div className="space-y-3">
            <label className="block">
              <span className="text-sm font-medium text-[color:var(--foreground)] mb-2 block">
                {t('displayLanguage')}
              </span>
              <select
                value={language}
                onChange={handleLanguageChange}
                className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--background)] px-4 py-2.5 text-sm text-[color:var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[color:var(--foreground)]/20"
              >
                {/* Rendering from a single source prevents mismatch with supported locales. */}
                {languageOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {/* Data & Privacy Section */}
        <div className={CARD_CLASS}>
          <h2 className={SECTION_TITLE_CLASS}>{t('dataPrivacy')}</h2>

          <div className="space-y-3">
            <button
              onClick={handleDownloadData}
              disabled={exportingData}
              className="w-full rounded-xl border border-[color:var(--border)] px-4 py-3 text-left text-sm font-medium text-[color:var(--foreground)] hover:bg-[color:var(--muted)]/50 transition-colors disabled:opacity-50"
            >
              <div className="flex items-center justify-between">
                <span>
                  {exportingData ? 'Downloading...' : t('downloadYourData')}
                </span>
                <Download className="h-4 w-4" />
              </div>
            </button>
            {exportDataError && (
              <p className="text-xs text-red-500">{exportDataError}</p>
            )}

            <button
              onClick={handleDeleteAllData}
              disabled={deletingData}
              className="w-full rounded-xl border border-red-500/20 px-4 py-3 text-left text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50"
            >
              <div className="flex items-center justify-between">
                <span>{deletingData ? 'Deleting...' : t('deleteAllData')}</span>
                <Trash2 className="h-4 w-4" />
              </div>
            </button>
            {deleteDataError && (
              <p className="text-xs text-red-500">{deleteDataError}</p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
