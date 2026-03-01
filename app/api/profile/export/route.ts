import { NextResponse } from "next/server";
import { requireDb, requireAuth, requireRateLimit, db } from "@/lib/api-helpers";
import { RL_PROFILE_UPDATE } from "@/lib/constants";
import type { ErrorResponse } from "@/types/auth";

// =====================================================
// GET /api/profile/export
// Returns all user data as a downloadable JSON file.
// =====================================================
export async function GET(req: Request) {
  try {
    const dbError = requireDb();
    if (dbError) return dbError;

    const { session, error: authError } = await requireAuth();
    if (authError) return authError;

    const rlError = requireRateLimit(req, `export:${session.user.id}`, RL_PROFILE_UPDATE);
    if (rlError) return rlError;

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        estimates: {
          select: {
            id: true,
            summary: true,
            totalCost: true,
            photos: true,
            createdAt: true,
            parts: {
              select: {
                name: true,
                cost: true,
                severity: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!user) {
      return NextResponse.json<ErrorResponse>(
        { success: false, message: "User not found." },
        { status: 404 },
      );
    }

    const exportData = {
      exportedAt: new Date().toISOString(),
      profile: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      estimates: user.estimates,
    };

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="insurevision-data-${Date.now()}.json"`,
      },
    });
  } catch (error) {
    console.error("Data export error:", error);
    return NextResponse.json<ErrorResponse>(
      { success: false, message: "Failed to export data. Please try again." },
      { status: 500 },
    );
  }
}
