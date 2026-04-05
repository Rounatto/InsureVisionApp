'use client';

import { useState, useRef, useEffect } from 'react';
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
  ShieldIcon,
} from '@/lib/icons';

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const canAccessAdmin = Boolean(session?.user?.isAdmin);

  const closeProfileMenu = () => {
    setProfileOpen(false);
  };

  const navItems = [
    { href: '/dashboard', label: 'Home', icon: HomeIcon },
    { href: '/dashboard/history', label: 'History', icon: ClockIcon },
    ...(canAccessAdmin ? [{ href: '/dashboard/admin', label: 'Admin', icon: ShieldIcon }] : []),
    { href: '/dashboard/profile', label: 'Profile', icon: UserIcon },
    { href: '/dashboard/settings', label: 'Settings', icon: SettingsIcon },
  ];

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useClickOutside(profileRef, closeProfileMenu);

  return (
    <>
      <div className="fixed left-4 top-3 z-50 flex flex-col gap-2 lg:hidden">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-xl border border-[color:var(--border)] bg-[color:var(--card)]/95 px-3 py-2 text-[color:var(--foreground)] shadow-lg backdrop-blur-sm"
          aria-label="Go to dashboard home"
        >
          <InsureVisionLogo className="h-5 w-5" />
          <span className="text-xs font-bold tracking-wide">InsureVision</span>
        </Link>

        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] text-[color:var(--foreground)] shadow-lg transition-colors hover:bg-[color:var(--muted)]"
          aria-label="Toggle sidebar menu"
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-5 w-5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-5 w-5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          )}
        </button>
      </div>

      {mobileMenuOpen && (
        <button
          type="button"
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/45 lg:hidden"
          aria-label="Close sidebar backdrop"
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
                    closeProfileMenu();
                    void handleSignOut();
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
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
