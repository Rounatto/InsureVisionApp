"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import InsureVisionLogo from "@/components/InsureVisionLogo";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import UserAvatar from "@/components/UserAvatar";
import { useClickOutside } from "@/hooks/useClickOutside";
import { HomeIcon, ClockIcon, UserIcon, SettingsIcon, ShieldIcon } from "@/lib/icons";
import { useLanguage } from "@/contexts/LanguageContext";
import { forceClientSignOut } from "@/lib/client-signout";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { t } = useLanguage();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const canAccessAdmin = session?.user?.isAdmin ?? false;

  const navItems = [
    { href: "/dashboard", label: t("home"), icon: HomeIcon },
    { href: "/dashboard/history", label: t("history"), icon: ClockIcon },
    ...(canAccessAdmin ? [{ href: "/dashboard/admin", label: t("admin"), icon: ShieldIcon }] : []),
    { href: "/dashboard/profile", label: t("profile"), icon: UserIcon },
    { href: "/dashboard/settings", label: t("settings"), icon: SettingsIcon },
  ];

  const handleSignOut = async () => {
    await forceClientSignOut("/login");
  };

  useClickOutside(profileRef, useCallback(() => setProfileOpen(false), []));

  // Close sidebar on route change (mobile)
  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const sidebarContent = (
    <>
      {/* Logo & Brand */}
      <div className="flex h-16 items-center gap-2.5 px-6 border-b border-[color:var(--border)]">
        <InsureVisionLogo className="h-7 w-7" />
        <span className="text-sm font-bold tracking-wide">InsureVision</span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-6">
        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[color:var(--foreground)] text-[color:var(--background)]"
                    : "text-[color:var(--foreground)] hover:bg-[color:var(--muted)]"
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User Profile Section */}
      <div className="border-t border-[color:var(--border)] p-4">
        <div className="flex items-center gap-3 mb-4">
          <ThemeSwitcher />
        </div>

        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen((v) => !v)}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 hover:bg-[color:var(--muted)] transition-colors"
          >
            <UserAvatar
              name={session?.user?.name}
              image={session?.user?.image}
              loading={status === "loading"}
              size="h-9 w-9"
              textSize="text-xs"
            />
            <div className="flex-1 min-w-0 text-left">
              {status === "loading" ? (
                <>
                  <div className="h-4 w-24 rounded bg-[color:var(--muted)] animate-pulse mb-1" />
                  <div className="h-3 w-32 rounded bg-[color:var(--muted)] animate-pulse" />
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-[color:var(--foreground)] truncate">
                    {session?.user?.name || "User"}
                  </p>
                  <p className="text-xs text-[color:var(--muted-foreground)] truncate">
                    {session?.user?.email || ""}
                  </p>
                </>
              )}
            </div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className={`h-4 w-4 text-[color:var(--muted-foreground)] transition-transform ${
                profileOpen ? "rotate-180" : ""
              }`}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>

          {profileOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-2 rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] shadow-xl overflow-hidden">
              <button
                onMouseDown={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setProfileOpen(false);
                  await handleSignOut();
                }}
                className="flex w-full items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="h-5 w-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
                  />
                </svg>
                {t("signOut")}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* ── Desktop sidebar: sticky column ── */}
      <aside className="hidden md:flex sticky top-0 h-screen w-64 flex-col border-r border-[color:var(--border)] bg-[color:var(--card)]/50">
        {sidebarContent}
      </aside>

      {/* ── Mobile overlay drawer ── */}
      {/* Backdrop */}
      <div
        className={`md:hidden fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className={`md:hidden fixed inset-y-0 left-0 z-50 w-64 flex flex-col border-r border-[color:var(--border)] bg-[color:var(--card)] shadow-2xl transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Close button inside drawer */}
        <button
          onClick={onClose}
          className="absolute top-4 right-3 flex h-8 w-8 items-center justify-center rounded-lg hover:bg-[color:var(--muted)] transition-colors z-10"
          aria-label="Close sidebar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5 text-[color:var(--foreground)]">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        {sidebarContent}
      </aside>
    </>
  );
}
