'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { ChevronRight } from 'lucide-react';
import UserAvatar from '@/components/UserAvatar';
import SectionHeading from '@/components/SectionHeading';
import PrimaryButton from '@/components/PrimaryButton';
import { GoogleLogo, LockIcon } from '@/lib/icons';
import { NETWORK_ERROR_MESSAGE } from '@/lib/constants';

const INPUT_CLASSES =
  'w-full rounded-lg border border-[color:var(--border)] bg-transparent px-3 py-2 text-sm text-[color:var(--foreground)] outline-none focus:border-[color:var(--foreground)] transition-colors';
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

export default function ProfilePage() {
  const { data: session, status, update: updateSession } = useSession();

  const [name, setName] = useState('');
  const [nameTouched, setNameTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarMsg, setAvatarMsg] = useState('');

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPwd, setChangingPwd] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [canChangePassword, setCanChangePassword] = useState<boolean | null>(
    null
  );

  const [stats, setStats] = useState<{
    estimates: number;
    photos: number;
  } | null>(null);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch('/api/auth/stats');
        if (res.ok) setStats(await res.json());
      } catch {
        // ignore
      }
    }
    loadStats();
  }, []);

  useEffect(() => {
    async function loadAccountCapabilities() {
      try {
        const res = await fetch('/api/auth/account-capabilities');
        if (!res.ok) return;
        const data = await res.json();
        setCanChangePassword(Boolean(data.canChangePassword));
      } catch {
        // ignore
      }
    }
    loadAccountCapabilities();
  }, []);

  const handleSaveProfile = async () => {
    const resolvedName = nameTouched ? name : session?.user?.name || '';
    setSaving(true);
    setSaveMsg('');
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: resolvedName }),
      });
      if (!res.ok) {
        const data = await res.json();
        setSaveMsg(data.error || 'Failed to save.');
      } else {
        await updateSession({ name: resolvedName });
        setNameTouched(false);
        setSaveMsg('Saved!');
        setTimeout(() => setSaveMsg(''), 2000);
      }
    } catch {
      setSaveMsg(NETWORK_ERROR_MESSAGE);
    }
    setSaving(false);
  };

  const handleChangePassword = async () => {
    if (canChangePassword === false) {
      setPwdError(
        'Password change is only available for email/password accounts.'
      );
      return;
    }

    setChangingPwd(true);
    setPwdError('');
    setPwdSuccess('');
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.details) {
          const msgs = Object.values(data.details).flat().join('. ');
          setPwdError(msgs);
        } else {
          setPwdError(data.error || 'Failed to change password.');
        }
      } else {
        setPwdSuccess('Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          setShowPasswordForm(false);
          setPwdSuccess('');
        }, 2000);
      }
    } catch {
      setPwdError(NETWORK_ERROR_MESSAGE);
    }
    setChangingPwd(false);
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) {
      setAvatarMsg('Please choose a photo first.');
      return;
    }

    setUploadingAvatar(true);
    setAvatarMsg('');
    try {
      const formData = new FormData();
      formData.append('avatar', avatarFile);

      const res = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setAvatarMsg(data.error || 'Failed to upload avatar.');
      } else {
        await updateSession({ image: data.user.image });
        setAvatarFile(null);
        setAvatarMsg('Photo updated.');
      }
    } catch {
      setAvatarMsg(NETWORK_ERROR_MESSAGE);
    }
    setUploadingAvatar(false);
  };

  return (
    <>
      <main className="mx-auto max-w-xl px-6 py-12">
        <div className="flex items-center gap-5 mb-12">
          <UserAvatar
            name={session?.user?.name}
            image={session?.user?.image}
            loading={status === 'loading'}
            size="h-16 w-16"
            textSize="text-2xl"
          />
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold text-[color:var(--foreground)]">
              {session?.user?.name || 'User'}
            </h1>
            <p className="text-xs text-[color:var(--muted-foreground)] mt-0.5">
              Member since February 2026
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <label className="rounded-full border border-[color:var(--border)] px-3 py-1.5 text-xs font-medium text-[color:var(--foreground)] cursor-pointer hover:bg-[color:var(--muted)] transition-colors">
                Choose Photo
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    if (file && !ALLOWED_AVATAR_TYPES.includes(file.type)) {
                      setAvatarFile(null);
                      setAvatarMsg('Use PNG, JPG, or WEBP image.');
                      return;
                    }
                    if (file && file.size > MAX_AVATAR_BYTES) {
                      setAvatarFile(null);
                      setAvatarMsg('Avatar must be 5MB or smaller.');
                      return;
                    }
                    setAvatarFile(file);
                    setAvatarMsg('');
                  }}
                />
              </label>
              <button
                onClick={handleAvatarUpload}
                disabled={!avatarFile || uploadingAvatar}
                className="rounded-full bg-[color:var(--foreground)] px-3 py-1.5 text-xs font-bold text-[color:var(--background)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploadingAvatar ? 'Uploading...' : 'Upload'}
              </button>
            </div>
            {avatarMsg && (
              <p
                className={`mt-2 text-xs ${avatarMsg === 'Photo updated.' ? 'text-green-600' : 'text-red-500'}`}
              >
                {avatarMsg}
              </p>
            )}
          </div>
        </div>

        <SectionHeading>Personal Information</SectionHeading>

        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between gap-4">
            <label className="text-sm text-[color:var(--muted-foreground)] shrink-0 w-28">
              Full Name
            </label>
            <input
              type="text"
              value={nameTouched ? name : session?.user?.name || ''}
              onChange={(e) => {
                if (!nameTouched) setNameTouched(true);
                setName(e.target.value);
              }}
              className={`flex-1 ${INPUT_CLASSES}`}
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <label className="text-sm text-[color:var(--muted-foreground)] shrink-0 w-28">
              Email
            </label>
            <p className="flex-1 text-sm text-[color:var(--foreground)] py-2">
              {session?.user?.email || '-'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <PrimaryButton
            size="xs"
            fullWidth={false}
            onClick={handleSaveProfile}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </PrimaryButton>
          {saveMsg && (
            <span
              className={`text-xs ${saveMsg === 'Saved!' ? 'text-green-600' : 'text-red-500'}`}
            >
              {saveMsg}
            </span>
          )}
        </div>

        <div className="border-b border-[color:var(--border)] my-10" />

        <SectionHeading>Security</SectionHeading>

        {canChangePassword !== false ? (
          <>
            <button
              onClick={() => {
                setShowPasswordForm(!showPasswordForm);
                setPwdError('');
                setPwdSuccess('');
              }}
              className="flex w-full items-center justify-between py-3 hover:opacity-70 transition-opacity"
            >
              <div className="flex items-center gap-3">
                <LockIcon className="h-5 w-5 text-[color:var(--muted-foreground)]" />
                <span className="text-sm text-[color:var(--foreground)]">
                  Change Password
                </span>
              </div>
              <ChevronRight
                className={`h-4 w-4 text-[color:var(--muted-foreground)] transition-transform ${showPasswordForm ? 'rotate-90' : ''}`}
              />
            </button>

            {showPasswordForm && (
              <div className="ml-8 mt-2 mb-4 space-y-3">
                <input
                  type="password"
                  placeholder="Current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className={INPUT_CLASSES}
                />
                <input
                  type="password"
                  placeholder="New password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={INPUT_CLASSES}
                />
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={INPUT_CLASSES}
                />
                {pwdError && <p className="text-xs text-red-500">{pwdError}</p>}
                {pwdSuccess && (
                  <p className="text-xs text-green-600">{pwdSuccess}</p>
                )}
                <PrimaryButton
                  size="xs"
                  fullWidth={false}
                  onClick={handleChangePassword}
                  disabled={
                    changingPwd ||
                    !currentPassword ||
                    !newPassword ||
                    !confirmPassword
                  }
                >
                  {changingPwd ? 'Updating...' : 'Update Password'}
                </PrimaryButton>
              </div>
            )}
          </>
        ) : (
          <div className="py-3">
            <div className="flex items-center gap-3">
              <LockIcon className="h-5 w-5 text-[color:var(--muted-foreground)]" />
              <span className="text-sm text-[color:var(--foreground)]">
                Change Password
              </span>
            </div>
            <p className="ml-8 mt-2 text-xs text-[color:var(--muted-foreground)]">
              Password changes are only available for email/password accounts.
            </p>
          </div>
        )}

        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <GoogleLogo className="h-5 w-5" />
            <span className="text-sm text-[color:var(--foreground)]">
              Google
            </span>
          </div>
          <span className="text-xs font-medium text-green-600">Connected</span>
        </div>

        <div className="border-b border-[color:var(--border)] my-10" />

        <SectionHeading>Activity</SectionHeading>

        <div className="flex gap-12 mb-4">
          <div>
            <p className="text-2xl font-bold text-[color:var(--foreground)]">
              {stats?.estimates ?? '-'}
            </p>
            <p className="text-xs text-[color:var(--muted-foreground)]">
              Estimates
            </p>
          </div>
          <div>
            <p className="text-2xl font-bold text-[color:var(--foreground)]">
              {stats?.photos ?? '-'}
            </p>
            <p className="text-xs text-[color:var(--muted-foreground)]">
              Photos
            </p>
          </div>
        </div>

        {stats !== null && stats.estimates === 0 && (
          <p className="text-xs text-[color:var(--muted-foreground)]">
            No activity yet - your estimation history will appear here.
          </p>
        )}

        <div className="h-16" />
      </main>
    </>
  );
}
