import { NextResponse } from "next/server";
import { requireDb, requireAuth, db } from "@/lib/server/api-helpers";

const QUERY_TIMEOUT_MS = 3000;

/**
 * GET /api/auth/stats
 *
 * Returns activity stats for the authenticated user.
 * Uses a single DB-level aggregation query instead of loading
 * all photo arrays into Node memory.
 */
export async function GET() {
  try {
    const dbError = requireDb();
    if (dbError) return dbError;

    const { session, error: authError } = await requireAuth();
    if (authError) return authError;

    const userId = session.user.id;

    // Single O(index-scan) query — no in-memory aggregation.
    const statsRows = await Promise.race([
      db.$queryRaw<{ estimates: number; photos: number }[]>`
        SELECT
          COUNT(*)::int                                       AS "estimates",
          COALESCE(SUM(array_length("photos", 1)), 0)::int   AS "photos"
        FROM "Estimate"
        WHERE "userId" = ${userId}
      `,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Stats query timeout")), QUERY_TIMEOUT_MS),
      ),
    ]);

    const [stats] = statsRows;

    return NextResponse.json(stats ?? { estimates: 0, photos: 0 });
  } catch (error) {
    console.error("Stats error:", error);
    // Fail-safe so profile page still renders during transient DB/network issues.
    return NextResponse.json({ estimates: 0, photos: 0 });
  }
}
