'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import InsureVisionLogo from '@/components/InsureVisionLogo';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import UserAvatar from '@/components/UserAvatar';
import { useClickOutside } from '@/hooks/useClickOutside';
import {
  HomeIcon,
  ClockIcon,
  UserIcon,
  SettingsIcon,
  MessageIcon,
  ShieldIcon,
} from '@/lib/icons';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Sidebar() {
  // `t` is read from LanguageContext.
  // Any language change in Settings triggers re-render with updated labels.
  const { t } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const canAccessAdmin = Boolean(session?.user?.isAdmin);

  // Navigation labels are translated at render time via `t("key")`.
  // The href values stay stable; only visible text changes with locale.
  const navItems = [
    { href: '/dashboard', label: t('home'), icon: HomeIcon },
    { href: '/dashboard/history', label: t('history'), icon: ClockIcon },
    ...(canAccessAdmin
      ? [{ href: '/dashboard/admin', label: t('admin'), icon: ShieldIcon }]
      : []),
    { href: '/dashboard/profile', label: t('profile'), icon: UserIcon },
    { href: '/dashboard/settings', label: t('settings'), icon: SettingsIcon },
  ];

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  useClickOutside(
    profileRef,
    useCallback(() => setProfileOpen(false), [])
  );

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-[color:var(--border)] bg-[color:var(--card)]/50">
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
                    ? 'bg-[color:var(--foreground)] text-[color:var(--background)]'
                    : 'text-[color:var(--foreground)] hover:bg-[color:var(--muted)]'
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="px-4 pb-3">
        <Link
          href="/dashboard/support"
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
            pathname === '/dashboard/support'
              ? 'bg-[color:var(--foreground)] text-[color:var(--background)]'
              : 'text-[color:var(--foreground)] hover:bg-[color:var(--muted)]'
          }`}
        >
          <MessageIcon className="h-5 w-5" />
          {t('support')}
        </Link>
      </div>

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
              loading={status === 'loading'}
              size="h-9 w-9"
              textSize="text-xs"
            />
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-semibold text-[color:var(--foreground)] truncate">
                {session?.user?.name || 'User'}
              </p>
              <p className="text-xs text-[color:var(--muted-foreground)] truncate">
                {session?.user?.email || ''}
              </p>
            </div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className={`h-4 w-4 text-[color:var(--muted-foreground)] transition-transform ${
                profileOpen ? 'rotate-180' : ''
              }`}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 8.25l-7.5 7.5-7.5-7.5"
              />
            </svg>
          </button>

          {profileOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-2 rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] shadow-xl overflow-hidden">
              <button
                onClick={() => {
                  setProfileOpen(false);
                  handleSignOut();
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
                {t('signOut')}
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
