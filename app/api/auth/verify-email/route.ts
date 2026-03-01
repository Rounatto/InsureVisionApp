import { NextResponse } from "next/server";
import { requireDb, requireRateLimit, db } from "@/lib/api-helpers";
import { hashToken } from "@/lib/tokens";
import { logAudit } from "@/lib/audit";
import { getClientIp } from "@/lib/rate-limit";
import { RL_VERIFY_EMAIL } from "@/lib/constants";

/**
 * GET /api/auth/verify-email?token=...
 *
 * Hashes the incoming raw token, looks up in SecurityToken,
 * marks the user as verified, and deletes the token — all atomically.
 * Redirects to /login on every outcome to avoid enumeration leaks.
 */
export async function GET(req: Request) {
  try {
    // ── Rate limit ───────────────────────────────────────
    const rlError = requireRateLimit(req, "verify", RL_VERIFY_EMAIL);
    if (rlError) return rlError;

    const dbError = requireDb();
    if (dbError) return dbError;

    const { searchParams } = new URL(req.url);
    const rawToken = searchParams.get("token");

    if (!rawToken) {
      return NextResponse.redirect(new URL("/login?error=invalid-link", req.url));
    }

    // ── Hash before lookup (never compare plaintext) ───────
    const hashed = hashToken(rawToken);

    const securityToken = await db.securityToken.findUnique({
      where: { hashedToken: hashed },
    });

    if (!securityToken || securityToken.type !== "EMAIL_VERIFICATION") {
      return NextResponse.redirect(new URL("/login?error=invalid-link", req.url));
    }

    // ── Expiry check ───────────────────────────────────────
    if (new Date() > securityToken.expires) {
      await db.securityToken.delete({ where: { id: securityToken.id } });
      return NextResponse.redirect(new URL("/login?error=expired-link", req.url));
    }

    // ── Atomic: verify user + delete token ─────────────────
    const user = await db.user.findUnique({
      where: { email: securityToken.identifier },
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

    // ── Audit ──────────────────────────────────────────────
    const ip = getClientIp(req);
    logAudit({ userId: user.id, action: "EMAIL_VERIFIED", ip });

    return NextResponse.redirect(new URL("/login?verified=true", req.url));
  } catch (error) {
    console.error("Verify email error:", error);
    return NextResponse.redirect(new URL("/login?error=server-error", req.url));
  }
}
