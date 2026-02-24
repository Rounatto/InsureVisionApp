"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import InsureVisionLogo from "@/components/InsureVisionLogo";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import UserAvatar from "@/components/UserAvatar";
import { useClickOutside } from "@/hooks/useClickOutside";
import { UserIcon } from "@/lib/icons";

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
                    <UserIcon className="h-[18px] w-[18px] text-[color:var(--muted-foreground)]" />
                    My Profile
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
