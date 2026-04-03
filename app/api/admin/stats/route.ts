import { NextResponse } from "next/server";
import { requireDb, requireAdmin, db } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";
import type { ErrorResponse } from "@/types/auth";

/**
 * GET /api/admin/stats
 *
 * Returns aggregated platform stats for the admin dashboard.
 * Restricted to allowlisted admin emails.
 */
export async function GET(req: Request) {
  try {
    const dbError = requireDb();
    if (dbError) return dbError;

    const { session, error: adminError } = await requireAdmin();
    if (adminError) return adminError;

    logAudit({ userId: session.user.id, action: "ADMIN_ACCESS", metadata: { route: "/api/admin/stats" } });

    const now = new Date();

    const [totalUsers, verifiedUsers, unverifiedUsers, totalEstimates, recentSignups] =
      await Promise.all([
        db.user.count(),
        db.user.count({ where: { emailVerified: { not: null } } }),
        db.user.count({ where: { emailVerified: null } }),
        db.estimate.count(),
        db.user.count({
          where: {
            createdAt: {
              gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // last 7 days
            },
          },
        }),
      ]);

    return NextResponse.json({
      totalUsers,
      verifiedUsers,
      unverifiedUsers,
      totalEstimates,
      recentSignups,
    });
  } catch (error) {
    console.error("[ADMIN_STATS_ERROR]", error);
    return NextResponse.json<ErrorResponse>(
      { success: false, message: "Failed to load stats" },
      { status: 500 },
    );
  }
}
