import { NextResponse } from "next/server";
import { auth } from "@/config/auth";
import { db } from "@/config/db";

const QUERY_TIMEOUT_MS = 3000;

/**
 * GET /api/estimates
 *
 * Returns all estimates for the authenticated user, newest first.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const estimates = await Promise.race([
      db.estimate.findMany({
        where: { userId: session.user.id },
        include: { parts: true },
        orderBy: { createdAt: "desc" },
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Estimates query timeout")), QUERY_TIMEOUT_MS),
      ),
    ]);

    return NextResponse.json(estimates);
  } catch (error) {
    console.error("Estimates fetch error:", error);
    // Fail-safe so history page can still load even if DB is timing out.
    return NextResponse.json([]);
  }
}
