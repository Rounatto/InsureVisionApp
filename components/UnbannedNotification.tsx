"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export default function UnbannedNotification() {
  const { data: session } = useSession();
  const [showNotification, setShowNotification] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!session?.user?.id) return;

    const checkUnbannedStatus = async () => {
      try {
        const res = await fetch("/api/messages/conversation");
        const storageKey = `ban-status-${session.user.id}`;

        // Check current ban status
        if (res.status === 403) {
          // User is CURRENTLY BANNED
          // Just mark them as banned, don't show any notification
          sessionStorage.setItem(storageKey, "banned");
          setShowNotification(false);
        } else if (res.ok) {
          // User is NOT banned
          const previousStatus = sessionStorage.getItem(storageKey);

          if (previousStatus === "banned") {
            // They were banned before but not anymore - SHOW NOTIFICATION
            setShowNotification(true);
          }

          // Update status to unbanned
          sessionStorage.setItem(storageKey, "unbanned");
        }
      } catch (err) {
        console.error("Error checking ban status:", err);
      } finally {
        setInitialized(true);
      }
    };

    checkUnbannedStatus();
  }, [session?.user?.id]);

  if (!initialized || !showNotification) return null;

  return (
    <div className="mb-6 mx-auto max-w-4xl px-6">
      <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-6 shadow-lg animate-slideDown">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 pt-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/20 border border-green-500/30">
              <svg
                className="h-6 w-6 text-green-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-green-900">
              Account Restriction Lifted! 🎉
            </h3>
            <p className="text-sm text-green-800 mt-1.5">
              Your account has been unbanned and restored to full access. You can now upload estimates, modify your profile, and use all features without any restrictions. Welcome back!
            </p>
            <button
              onClick={() => setShowNotification(false)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 active:scale-95 transition-all shadow-sm"
            >
              Got it
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
