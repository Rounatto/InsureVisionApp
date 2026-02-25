import { NextResponse } from "next/server";
import { db } from "@/config/db";
import { hashToken } from "@/lib/tokens";
import { checkRateLimit, rateLimitResponse, getClientIp } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";
import { RL_WINDOW_MS, RL_VERIFY_EMAIL } from "@/lib/constants";

/**
 * GET /api/auth/verify-email?token=...
 *
 * Hashes the incoming raw token, looks up in SecurityToken,
 * marks the user as verified, and deletes the token — all atomically.
 * Redirects to /login on every outcome to avoid enumeration leaks.
 */
export async function GET(req: Request) {
  try {
    // ── Rate limit ─────────────────────────────────────────
    const ip = getClientIp(req);
    const rl = checkRateLimit(`verify:${ip}`, RL_VERIFY_EMAIL, RL_WINDOW_MS);
    if (!rl.ok) return rateLimitResponse(rl);

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
    logAudit({ userId: user.id, action: "EMAIL_VERIFIED", ip });

    return NextResponse.redirect(new URL("/login?verified=true", req.url));
  } catch (error) {
    console.error("Verify email error:", error);
    return NextResponse.redirect(new URL("/login?error=server-error", req.url));
  }
}
