import { NextResponse } from 'next/server';
import { requireDb, requireAdmin, db } from '@/lib/api-helpers';
import { logAudit } from '@/lib/audit';
import { getClientIp } from '@/lib/rate-limit';
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

    const ip = getClientIp(req);
    logAudit({
      userId: session.user.id,
      action: 'ADMIN_ACCESS',
      ip,
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
