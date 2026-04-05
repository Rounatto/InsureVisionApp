import { NextResponse } from 'next/server';
import {
  requireDb,
  requireAuth,
  db,
} from '@/lib/server/api-helpers';
import { logAudit } from '@/lib/server/audit';
import type { ErrorResponse } from '@/types/auth';

/**
 * DELETE /api/auth/delete-account
 *
 * Deletes the authenticated user's account.
 * Requires only a valid session — no password needed.
 *
 * Wraps deletion in a transaction with explicit cleanup of auth/token rows
 * before deleting the user record.
 */
export async function DELETE(req: Request) {
  try {
    const dbError = requireDb();
    if (dbError) return dbError;

    const { session, error: authError } = await requireAuth();
    if (authError) return authError;

    const userId = session.user.id;

    // ── Check if user is banned and fetch email ─────────────────────────────
    const bannedCheckUser = await db.user.findUnique({
      where: { id: userId },
      select: { banned: true, email: true },
    });

    if (bannedCheckUser?.banned) {
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          message: 'Your account is banned and cannot perform this action.',
        },
        { status: 403 }
      );
    }

    if (!bannedCheckUser) {
      return NextResponse.json<ErrorResponse>(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // ── Atomic hard delete with full cleanup ───────────────
    await db.$transaction(async (tx) => {
      await tx.verificationToken.deleteMany({
        where: { identifier: bannedCheckUser.email },
      });
      await tx.securityToken.deleteMany({
        where: { identifier: bannedCheckUser.email },
      });
      await tx.account.deleteMany({ where: { userId } });
      await tx.session.deleteMany({ where: { userId } });
      await tx.user.delete({ where: { id: userId } });
    });

    // ── Audit (userId will no longer exist, but we log it for records) ───
    logAudit({ userId, action: 'ACCOUNT_DELETED' });

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully.',
    });
  } catch (error) {
    console.error('Delete account error:', error);
    return NextResponse.json<ErrorResponse>(
      {
        success: false,
        message: 'Failed to delete account. Please try again.',
      },
      { status: 500 }
    );
  }
}
