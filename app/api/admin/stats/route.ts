import { NextResponse } from "next/server";
import { auth } from "@/config/auth";
import { db } from "@/config/db";
import { isAdminEmail } from "@/lib/admin";

/**
 * GET /api/admin/stats
 *
 * Returns aggregated platform stats for the admin dashboard.
 * Restricted to allowlisted admin emails.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email || !isAdminEmail(session.user.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

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
    return NextResponse.json(
      { error: "Failed to load stats" },
      { status: 500 },
    );
  }
}
