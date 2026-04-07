'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
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
import { ChevronDown, LogOut, Menu, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Sidebar() {
  // `t` is read from LanguageContext.
  // Any language change in Settings triggers re-render with updated labels.
  const { t } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useClickOutside(
    profileRef,
    useCallback(() => setProfileOpen(false), [])
  );

  return (
    <>
      <div className="fixed left-4 top-3 z-50 flex flex-col gap-2 lg:hidden">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-xl border border-[color:var(--border)] bg-[color:var(--card)]/95 px-3 py-2 text-[color:var(--foreground)] shadow-lg backdrop-blur-sm"
          aria-label={t('goToDashboardHome')}
        >
          <InsureVisionLogo className="h-5 w-5" />
          <span className="text-xs font-bold tracking-wide">InsureVision</span>
        </Link>

        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] text-[color:var(--foreground)] shadow-lg transition-colors hover:bg-[color:var(--muted)]"
          aria-label={t('toggleSidebarMenu')}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
      </div>

      {mobileMenuOpen && (
        <button
          type="button"
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/45 lg:hidden"
          aria-label={t('closeSidebarBackdrop')}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[86vw] flex-col border-r border-[color:var(--border)] bg-[color:var(--card)]/95 backdrop-blur-sm transition-transform duration-300 lg:h-screen lg:w-64 lg:max-w-none lg:translate-x-0 lg:bg-[color:var(--card)]/50 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
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
              <ChevronDown
                className={`h-4 w-4 text-[color:var(--muted-foreground)] transition-transform ${
                  profileOpen ? 'rotate-180' : ''
                }`}
              />
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
                  <LogOut className="h-5 w-5" />
                  {t('signOut')}
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
