import { NextResponse } from "next/server";
import { auth } from "@/config/auth";
import { db } from "@/config/db";

/**
 * GET /api/auth/stats
 *
 * Returns activity stats for the authenticated user.
 * Uses a single DB-level aggregation query instead of loading
 * all photo arrays into Node memory.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Single O(index-scan) query — no in-memory aggregation.
    const [stats] = await db.$queryRaw<
      { estimates: number; photos: number }[]
    >`
      SELECT
        COUNT(*)::int                                       AS "estimates",
        COALESCE(SUM(array_length("photos", 1)), 0)::int   AS "photos"
      FROM "Estimate"
      WHERE "userId" = ${userId}
    `;

    return NextResponse.json(stats ?? { estimates: 0, photos: 0 });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json(
      { error: "Failed to load stats." },
      { status: 500 },
    );
  }
}
