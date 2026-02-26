import { NextResponse } from "next/server";
import { auth } from "@/config/auth";
import { db } from "@/config/db";

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

    const estimates = await db.estimate.findMany({
      where: { userId: session.user.id },
      include: { parts: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(estimates);
  } catch (error) {
    console.error("Estimates fetch error:", error);
    return NextResponse.json(
      { error: "Failed to load estimates." },
      { status: 500 }
    );
  }
}
