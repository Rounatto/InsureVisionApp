import { NextResponse } from "next/server";
import { requireDb, db } from "@/lib/api-helpers";
import { hashToken } from "@/lib/tokens";
import { logAudit } from "@/lib/audit";

/**
 * GET /api/auth/verify-email?token=...
 *
 * Verifies a registration token and marks the user's email as verified.
 */
export async function GET(req: Request) {
  try {
    const dbError = requireDb();
    if (dbError) return dbError;

    const { searchParams } = new URL(req.url);
    const rawToken = searchParams.get("token");

    if (!rawToken) {
      return NextResponse.redirect(new URL("/login?error=invalid-link", req.url));
    }

    const hashed = hashToken(rawToken);

    const securityToken = await db.securityToken.findUnique({
      where: { hashedToken: hashed },
    });

    if (!securityToken || securityToken.type !== "EMAIL_VERIFICATION") {
      return NextResponse.redirect(new URL("/login?error=invalid-link", req.url));
    }

    if (new Date() > securityToken.expires) {
      await db.securityToken.delete({ where: { id: securityToken.id } });
      return NextResponse.redirect(new URL("/login?error=expired-link", req.url));
    }

    const user = await db.user.findUnique({
      where: { email: securityToken.identifier },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.redirect(new URL("/login?error=invalid-link", req.url));
    }

    await db.$transaction([
      db.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      }),
      db.securityToken.delete({ where: { id: securityToken.id } }),
    ]);

    logAudit({ userId: user.id, action: "EMAIL_VERIFIED" });

    return NextResponse.redirect(new URL("/login?verified=true", req.url));
  } catch (error) {
    console.error("Verify email error:", error);
    return NextResponse.redirect(new URL("/login?error=server-error", req.url));
  }
}
