"use client";

import { useState, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import DashboardLayout from "@/components/DashboardLayout";
import UserAvatar from "@/components/UserAvatar";
import SectionHeading from "@/components/SectionHeading";
import PrimaryButton from "@/components/PrimaryButton";
import { LockIcon } from "@/lib/icons";
import { NETWORK_ERROR_MESSAGE } from "@/lib/constants";

const INPUT_CLASSES = "w-full rounded-lg border border-[color:var(--border)] bg-transparent px-3 py-2 text-sm text-[color:var(--foreground)] outline-none focus:border-[color:var(--foreground)] transition-colors";
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = ["image/png", "image/jpeg", "image/webp"];

export default function ProfilePage() {
  const { data: session, status, update: updateSession } = useSession();

  const [name, setName] = useState("");
  const [nameTouched, setNameTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarMsg, setAvatarMsg] = useState("");

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPwd, setChangingPwd] = useState(false);
  const [pwdError, setPwdError] = useState("");
  const [pwdSuccess, setPwdSuccess] = useState("");
  const [canChangePassword, setCanChangePassword] = useState<boolean | null>(null);

  const [stats, setStats] = useState<{ estimates: number; photos: number } | null>(null);

  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("/api/auth/stats");
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
        const res = await fetch("/api/auth/account-capabilities");
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
    const resolvedName = nameTouched ? name : (session?.user?.name || "");
    setSaving(true);
    setSaveMsg("");
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: resolvedName }),
      });
      if (!res.ok) {
        const data = await res.json();
        setSaveMsg(data.error || "Failed to save.");
      } else {
        await updateSession({ name: resolvedName });
        setNameTouched(false);
        setSaveMsg("Saved!");
        setTimeout(() => setSaveMsg(""), 2000);
      }
    } catch {
      setSaveMsg(NETWORK_ERROR_MESSAGE);
    }
    setSaving(false);
  };

  const handleChangePassword = async () => {
    if (canChangePassword === false) {
      setPwdError("Password change is only available for email/password accounts.");
      return;
    }

    setChangingPwd(true);
    setPwdError("");
    setPwdSuccess("");
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.details) {
          const msgs = Object.values(data.details).flat().join(". ");
          setPwdError(msgs);
        } else {
          setPwdError(data.error || "Failed to change password.");
        }
      } else {
        setPwdSuccess("Password changed successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => {
          setShowPasswordForm(false);
          setPwdSuccess("");
        }, 2000);
      }
    } catch {
      setPwdError(NETWORK_ERROR_MESSAGE);
    }
    setChangingPwd(false);
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) {
      setAvatarMsg("Please choose a photo first.");
      return;
    }

    setUploadingAvatar(true);
    setAvatarMsg("");
    try {
      const formData = new FormData();
      formData.append("avatar", avatarFile);

      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setAvatarMsg(data.error || "Failed to upload avatar.");
      } else {
        await updateSession({ image: data.user.image });
        setAvatarFile(null);
        setAvatarMsg("Photo updated.");
      }
    } catch {
      setAvatarMsg(NETWORK_ERROR_MESSAGE);
    }
    setUploadingAvatar(false);
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

      await signOut({ callbackUrl: "/login" });
    } catch {
      setDeleteError(NETWORK_ERROR_MESSAGE);
      setDeleting(false);
    }
  };

  return (
    <DashboardLayout>
      <main className="mx-auto max-w-xl px-6 py-12">
        <div className="flex items-center gap-5 mb-12">
          <UserAvatar name={session?.user?.name} image={session?.user?.image} loading={status === "loading"} size="h-16 w-16" textSize="text-2xl" />
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold text-[color:var(--foreground)]">{session?.user?.name || "User"}</h1>
            <p className="text-xs text-[color:var(--muted-foreground)] mt-0.5">Member since February 2026</p>
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
                      setAvatarMsg("Use PNG, JPG, or WEBP image.");
                      return;
                    }
                    if (file && file.size > MAX_AVATAR_BYTES) {
                      setAvatarFile(null);
                      setAvatarMsg("Avatar must be 5MB or smaller.");
                      return;
                    }
                    setAvatarFile(file);
                    setAvatarMsg("");
                  }}
                />
              </label>
              <button
                onClick={handleAvatarUpload}
                disabled={!avatarFile || uploadingAvatar}
                className="rounded-full bg-[color:var(--foreground)] px-3 py-1.5 text-xs font-bold text-[color:var(--background)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploadingAvatar ? "Uploading..." : "Upload"}
              </button>
            </div>
            {avatarMsg && (
              <p className={`mt-2 text-xs ${avatarMsg === "Photo updated." ? "text-green-600" : "text-red-500"}`}>
                {avatarMsg}
              </p>
            )}
          </div>
        </div>

        <SectionHeading>Personal Information</SectionHeading>

        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between gap-4">
            <label className="text-sm text-[color:var(--muted-foreground)] shrink-0 w-28">Full Name</label>
            <input
              type="text"
              value={nameTouched ? name : (session?.user?.name || "")}
              onChange={(e) => {
                if (!nameTouched) setNameTouched(true);
                setName(e.target.value);
              }}
              className={`flex-1 ${INPUT_CLASSES}`}
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <label className="text-sm text-[color:var(--muted-foreground)] shrink-0 w-28">Email</label>
            <p className="flex-1 text-sm text-[color:var(--foreground)] py-2">{session?.user?.email || "-"}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <PrimaryButton size="xs" fullWidth={false} onClick={handleSaveProfile} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </PrimaryButton>
          {saveMsg && (
            <span className={`text-xs ${saveMsg === "Saved!" ? "text-green-600" : "text-red-500"}`}>{saveMsg}</span>
          )}
        </div>

        <div className="border-b border-[color:var(--border)] my-10" />

        <SectionHeading>Security</SectionHeading>

        {canChangePassword !== false ? (
          <>
            <button
              onClick={() => {
                setShowPasswordForm(!showPasswordForm);
                setPwdError("");
                setPwdSuccess("");
              }}
              className="flex w-full items-center justify-between py-3 hover:opacity-70 transition-opacity"
            >
              <div className="flex items-center gap-3">
                <LockIcon className="h-5 w-5 text-[color:var(--muted-foreground)]" />
                <span className="text-sm text-[color:var(--foreground)]">Change Password</span>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`h-4 w-4 text-[color:var(--muted-foreground)] transition-transform ${showPasswordForm ? "rotate-90" : ""}`}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
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
                {pwdSuccess && <p className="text-xs text-green-600">{pwdSuccess}</p>}
                <PrimaryButton size="xs" fullWidth={false} onClick={handleChangePassword} disabled={changingPwd || !currentPassword || !newPassword || !confirmPassword}>
                  {changingPwd ? "Updating..." : "Update Password"}
                </PrimaryButton>
              </div>
            )}
          </>
        ) : (
          <div className="py-3">
            <div className="flex items-center gap-3">
              <LockIcon className="h-5 w-5 text-[color:var(--muted-foreground)]" />
              <span className="text-sm text-[color:var(--foreground)]">Change Password</span>
            </div>
            <p className="ml-8 mt-2 text-xs text-[color:var(--muted-foreground)]">
              Password changes are only available for email/password accounts.
            </p>
          </div>
        )}

        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <svg viewBox="0 0 24 24" className="h-5 w-5">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            <span className="text-sm text-[color:var(--foreground)]">Google</span>
          </div>
          <span className="text-xs font-medium text-green-600">Connected</span>
        </div>

        <div className="border-b border-[color:var(--border)] my-10" />

        <SectionHeading>Activity</SectionHeading>

        <div className="flex gap-12 mb-4">
          <div>
            <p className="text-2xl font-bold text-[color:var(--foreground)]">{stats?.estimates ?? "-"}</p>
            <p className="text-xs text-[color:var(--muted-foreground)]">Estimates</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-[color:var(--foreground)]">{stats?.photos ?? "-"}</p>
            <p className="text-xs text-[color:var(--muted-foreground)]">Photos</p>
          </div>
        </div>

        {stats !== null && stats.estimates === 0 && (
          <p className="text-xs text-[color:var(--muted-foreground)]">No activity yet - your estimation history will appear here.</p>
        )}

        <div className="border-b border-[color:var(--border)] my-10" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-red-500">Delete Account</p>
            <p className="text-xs text-[color:var(--muted-foreground)] mt-1">Permanently remove your account and all data.</p>
            {deleteError && (
              <p className="text-[11px] text-red-500 mt-2">{deleteError}</p>
            )}
          </div>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={deleting}
            className="shrink-0 self-start rounded-full border border-red-500 px-5 py-2 text-sm font-medium text-red-500 hover:bg-red-500 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>

        <div className="h-16" />
      </main>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-2xl bg-[color:var(--card)] border border-[color:var(--border)] p-6 shadow-xl">
            <h3 className="text-lg font-bold text-[color:var(--foreground)] mb-2">
              Delete Account?
            </h3>
            <p className="text-sm text-[color:var(--muted-foreground)] mb-6">
              This will permanently delete your account, all your data, and cannot be undone. Are you sure?
            </p>
            {deleteError && (
              <p className="text-[11px] text-red-500 mb-4">{deleteError}</p>
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
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="rounded-full bg-red-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
