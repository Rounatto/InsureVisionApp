import { NextResponse } from "next/server";
import { requireDb, requireAuth, db } from "@/lib/server/api-helpers";

export async function GET() {
  try {
    const dbError = requireDb();
    if (dbError) return dbError;

    const { session, error: authError } = await requireAuth();
    if (authError) return authError;

    const user = await Promise.race([
      db.user.findUnique({
        where: { id: session.user.id },
        select: { password: true },
      }),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 2500)),
    ]);

    return NextResponse.json({
      canChangePassword: Boolean(user?.password),
    });
  } catch (error) {
    console.error("Account capabilities error:", error);
    // Fail-safe: do not break profile page if DB is temporarily unavailable.
    return NextResponse.json({ canChangePassword: false });
  }
}

