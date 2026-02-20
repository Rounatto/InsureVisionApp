"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import InsureVisionLogo from "@/components/InsureVisionLogo";
import { ThemeSwitcher } from "@/components/theme-switcher";
import UserAvatar from "@/components/UserAvatar";
import { useClickOutside } from "@/hooks/useClickOutside";

export default function Navbar() {
  const router = useRouter();
  const { data: session } = useSession();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  useClickOutside(profileRef, useCallback(() => setProfileOpen(false), []));

  return (
    <nav className="sticky top-0 z-40 bg-[color:var(--card)]/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Left — Logo & Name */}
        <button onClick={() => router.push("/")} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <InsureVisionLogo className="h-7 w-7" />
          <span className="text-sm font-bold tracking-wide">InsureVision</span>
        </button>

        {/* Right — Actions */}
        <div className="flex items-center gap-3">
          <ThemeSwitcher />

          {/* Profile dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen((v) => !v)}
              aria-label="Profile menu"
            >
              <UserAvatar name={session?.user?.name} className="hover:border-[color:var(--foreground)]/30 transition-colors" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-full mt-1 w-64 rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] shadow-xl overflow-hidden">
                {/* User info header */}
                <div className="px-4 py-4 border-b border-[color:var(--border)]">
                  <div className="flex items-center gap-3">
                    <UserAvatar name={session?.user?.name} size="h-10 w-10" textSize="text-sm" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[color:var(--foreground)] truncate">{session?.user?.name || "User"}</p>
                      <p className="text-xs text-[color:var(--muted-foreground)] truncate">{session?.user?.email || ""}</p>
                    </div>
                  </div>
                </div>

                {/* Menu items */}
                <div className="py-1.5">
                  <button
                    onClick={() => { setProfileOpen(false); router.push("/profile"); }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-[color:var(--foreground)] hover:bg-[color:var(--muted)]/50 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-[18px] w-[18px] text-[color:var(--muted-foreground)]">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                    My Profile
                  </button>
                  <button
                    onClick={() => { setProfileOpen(false); router.push("/settings"); }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-[color:var(--foreground)] hover:bg-[color:var(--muted)]/50 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-[18px] w-[18px] text-[color:var(--muted-foreground)]">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Settings
                  </button>
                </div>

                {/* Sign out */}
                <div className="border-t border-[color:var(--border)] py-1.5">
                  <button
                    onClick={() => { setProfileOpen(false); handleSignOut(); }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-[18px] w-[18px]">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
