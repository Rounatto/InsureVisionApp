import { NextResponse } from 'next/server';
import { db, requireAuth, requireDb } from '@/lib/api-helpers';
import type { ErrorResponse } from '@/types/auth';

/**
 * GET /api/messages/ban-status
 *
 * Returns whether the authenticated user is currently banned.
 */
export async function GET(): Promise<NextResponse> {
  const dbError = requireDb();
  if (dbError) return dbError;

  const { session, error: authError } = await requireAuth();
  if (authError) return authError;

  try {
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { banned: true },
    });

    return NextResponse.json(
      {
        success: true,
        isBanned: Boolean(user?.banned),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[BAN_STATUS_ERROR]', error);
    return NextResponse.json<ErrorResponse>(
      { success: false, message: 'Failed to fetch ban status' },
      { status: 500 }
    );
  }
}
