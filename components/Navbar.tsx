'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, MessageSquare } from 'lucide-react';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();

  const isAdminContext =
    session?.user?.isAdmin || pathname.startsWith('/dashboard/admin');
  const isAdminMessagesPage = pathname.startsWith('/dashboard/admin/messages');

  const messagesPath = isAdminContext
    ? '/dashboard/admin/messages'
    : '/dashboard/messages';

  const actionPath = isAdminMessagesPage ? '/dashboard/admin' : messagesPath;

  const actionLabel = isAdminMessagesPage ? 'Back to admin' : 'Open messages';

  const actionTitle = isAdminMessagesPage ? 'Back to admin' : 'Messages';

  const handleMessagesClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();

    if (pathname === actionPath) {
      window.location.assign(actionPath);
      return;
    }

    router.push(actionPath);
  };

  return (
    <nav className="sticky top-0 z-40 bg-[color:var(--card)]/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Left — Back action for admin messages */}
        <div className="flex items-center">
          {isAdminMessagesPage ? (
            <Link
              href={actionPath}
              onClick={handleMessagesClick}
              className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] px-3 py-1.5 text-sm font-medium text-[color:var(--muted-foreground)] hover:bg-[color:var(--muted)] hover:text-[color:var(--foreground)] transition-colors"
              aria-label={actionLabel}
              title={actionTitle}
            >
              <ArrowLeft className="h-[16px] w-[16px]" />
              Back
            </Link>
          ) : null}
        </div>

        {/* Right — Actions */}
        <div className="flex items-center gap-3">
          {!isAdminMessagesPage ? (
            <Link
              href={actionPath}
              onClick={handleMessagesClick}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--border)] text-[color:var(--muted-foreground)] hover:bg-[color:var(--muted)] hover:text-[color:var(--foreground)] transition-colors"
              aria-label={actionLabel}
              title={actionTitle}
            >
              <MessageSquare className="h-[18px] w-[18px]" />
            </Link>
          ) : null}
        </div>
      </div>
    </nav>
  );
}
