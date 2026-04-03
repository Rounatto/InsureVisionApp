import { NextResponse } from 'next/server';
import { requireDb, requireAdmin, db } from '@/lib/api-helpers';
import { isAdminEmail } from '@/lib/admin';
import { logAudit } from '@/lib/audit';
import type { ErrorResponse } from '@/types/auth';

const PAGE_SIZE = 20;

/**
 * GET /api/admin/users?page=1&search=...
 *
 * Returns a paginated list of users for the admin dashboard.
 * Restricted to allowlisted admin emails.
 */
export async function GET(req: Request) {
  try {
    const dbError = requireDb();
    if (dbError) return dbError;

    const { session, error: adminError } = await requireAdmin();
    if (adminError) return adminError;

    logAudit({
      userId: session.user.id,
      action: 'ADMIN_ACCESS',
      metadata: { route: '/api/admin/users' },
    });

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get('page') ?? 1));
    const search = searchParams.get('search')?.trim() ?? '';

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          emailVerified: true,
          image: true,
          banned: true,
          createdAt: true,
          accounts: {
            select: {
              provider: true,
            },
          },
          _count: { select: { estimates: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      db.user.count({ where }),
    ]);

    return NextResponse.json({
      users: users.map((u) => ({
        authProvider: u.accounts.some((a) => a.provider === 'google')
          ? 'Google'
          : 'Email/Password',
        id: u.id,
        name: u.name,
        email: u.email,
        emailVerified: !!u.emailVerified,
        image: u.image,
        createdAt: u.createdAt,
        estimateCount: u._count.estimates,
        isAdmin: isAdminEmail(u.email),
        banned: u.banned,
      })),
      total,
      page,
      pageSize: PAGE_SIZE,
      totalPages: Math.ceil(total / PAGE_SIZE),
    });
  } catch (error) {
    console.error('[ADMIN_USERS_ERROR]', error);
    return NextResponse.json<ErrorResponse>(
      { success: false, message: 'Failed to load users' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/users?id=...
 *
 * Deletes a user from the system.
 * Restricted to allowlisted admin emails.
 */
export async function DELETE(req: Request) {
  try {
    const dbError = requireDb();
    if (dbError) return dbError;

    const { session, error: adminError } = await requireAdmin();
    if (adminError) return adminError;

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('id')?.trim();

    if (!userId) {
      return NextResponse.json<ErrorResponse>(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      );
    }

    // Fetch the user to be deleted
    const userToDelete = await db.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!userToDelete) {
      return NextResponse.json<ErrorResponse>(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Prevent deleting admins
    if (isAdminEmail(userToDelete.email)) {
      return NextResponse.json<ErrorResponse>(
        { success: false, message: 'Cannot delete admin users' },
        { status: 403 }
      );
    }

    // Full hard-delete workflow:
    // 1) Remove auth/session/token artifacts
    // 2) Remove app-owned records that can outlive the user (audit/security)
    // 3) Delete the user row last
    await db.$transaction(async (tx) => {
      await tx.verificationToken.deleteMany({
        where: { identifier: userToDelete.email },
      });
      await tx.securityToken.deleteMany({
        where: { identifier: userToDelete.email },
      });
      await tx.account.deleteMany({ where: { userId } });
      await tx.session.deleteMany({ where: { userId } });
      await tx.estimate.deleteMany({ where: { userId } });
      await tx.auditLog.deleteMany({ where: { userId } });

      await tx.user.delete({ where: { id: userId } });
    });

    logAudit({
      userId: session.user.id,
      action: 'ADMIN_DELETE_USER',
      metadata: { route: '/api/admin/users', mode: 'hard-delete' },
    });

    return NextResponse.json(
      { success: true, message: 'User deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('[ADMIN_DELETE_USER_ERROR]', error);
    return NextResponse.json<ErrorResponse>(
      { success: false, message: 'Failed to delete user' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/users?id=...&action=ban|unban
 *
 * Bans or unbans a user from the system.
 * Restricted to allowlisted admin emails.
 */
export async function PATCH(req: Request) {
  try {
    const dbError = requireDb();
    if (dbError) return dbError;

    const { session, error: adminError } = await requireAdmin();
    if (adminError) return adminError;

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('id')?.trim();
    const action = searchParams.get('action')?.trim();

    if (!userId) {
      return NextResponse.json<ErrorResponse>(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      );
    }

    if (action !== 'ban' && action !== 'unban') {
      return NextResponse.json<ErrorResponse>(
        { success: false, message: 'Invalid action. Use "ban" or "unban"' },
        { status: 400 }
      );
    }

    // Fetch the user
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { email: true, banned: true },
    });

    if (!user) {
      return NextResponse.json<ErrorResponse>(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Prevent banning admins
    if (isAdminEmail(user.email)) {
      return NextResponse.json<ErrorResponse>(
        { success: false, message: 'Cannot ban admin users' },
        { status: 403 }
      );
    }

    // Check if user is already in the desired state
    if (action === 'ban' && user.banned) {
      return NextResponse.json<ErrorResponse>(
        { success: false, message: 'User is already banned' },
        { status: 400 }
      );
    }

    if (action === 'unban' && !user.banned) {
      return NextResponse.json<ErrorResponse>(
        { success: false, message: 'User is not banned' },
        { status: 400 }
      );
    }

    const auditAction =
      action === 'ban' ? 'ADMIN_BAN_USER' : 'ADMIN_UNBAN_USER';

    logAudit({
      userId: session.user.id,
      action: auditAction,
      metadata: { targetUserId: userId },
    });

    // Update user banned status
    await db.user.update({
      where: { id: userId },
      data: { banned: action === 'ban' },
    });

    // Delete user sessions if banning
    if (action === 'ban') {
      await db.session.deleteMany({ where: { userId } });
    }

    return NextResponse.json(
      {
        success: true,
        message: `User ${action === 'ban' ? 'banned' : 'unbanned'} successfully`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[ADMIN_BAN_USER_ERROR]', error);
    return NextResponse.json<ErrorResponse>(
      { success: false, message: 'Failed to update user ban status' },
      { status: 500 }
    );
  }
}
