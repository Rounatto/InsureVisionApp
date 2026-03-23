"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export default function UnbannedNotification() {
  const { data: session } = useSession();
  const [showNotification, setShowNotification] = useState(false);
  const [previousIsBanned, setPreviousIsBanned] = useState<boolean | null>(null);

  useEffect(() => {
    if (!session?.user?.id) return;

    const checkUnbannedStatus = async () => {
      try {
        const res = await fetch("/api/messages/conversation");

        // Determine current ban status from response
        // 403 = NOT banned (can't access banned user conversations)
        // 200 = IS banned (can access their conversation)
        const currentIsBanned = res.ok && res.status === 200;

        // If we have a previous state and it transitioned from banned to unbanned
        if (previousIsBanned === true && currentIsBanned === false) {
          // User just got unbanned - show celebration!
          setShowNotification(true);
        } else if (currentIsBanned === true || previousIsBanned === null) {
          // User is banned or first time checking - hide celebration
          setShowNotification(false);
        }

        // Update previous state
        setPreviousIsBanned(currentIsBanned);
      } catch (err) {
        console.error("Error checking ban status:", err);
        setShowNotification(false);
      }
    };

    // Check immediately on mount
    checkUnbannedStatus();

    // Then poll silently every 2 seconds
    const interval = setInterval(checkUnbannedStatus, 2000);

    return () => clearInterval(interval);
  }, [session?.user?.id]);

  if (!showNotification) return null;

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
