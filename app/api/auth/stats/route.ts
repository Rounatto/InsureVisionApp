import { NextResponse } from "next/server";
import { auth } from "@/config/auth";
import { db } from "@/config/db";

/**
 * GET /api/auth/stats
 *
 * Returns activity stats for the authenticated user.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const [estimateCount, photoResult] = await Promise.all([
      db.estimate.count({ where: { userId } }),
      db.estimate.findMany({
        where: { userId },
        select: { photos: true },
      }),
    ]);

    const photoCount = photoResult.reduce(
      (sum, est) => sum + est.photos.length,
      0
    );

    return NextResponse.json({ estimates: estimateCount, photos: photoCount });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json(
      { error: "Failed to load stats." },
      { status: 500 }
    );
  }
}
