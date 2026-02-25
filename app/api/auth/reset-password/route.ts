import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { db } from "@/config/db";
import { resetPasswordSchema } from "@/lib/validations/auth";
import { hashToken } from "@/lib/tokens";
import { checkRateLimit, rateLimitResponse, getClientIp } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";
import { SALT_ROUNDS, RL_WINDOW_MS, RL_RESET_PW } from "@/lib/constants";
import { ensureTrustedOrigin } from "@/lib/security";

export async function POST(req: Request) {
  try {
    const originError = ensureTrustedOrigin(req);
    if (originError) return originError;

    // ── Rate limit ─────────────────────────────────────────
    const ip = getClientIp(req);
    const rl = checkRateLimit(`reset:${ip}`, RL_RESET_PW, RL_WINDOW_MS);
    if (!rl.ok) return rateLimitResponse(rl);

    const body = await req.json();

    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Invalid input";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { token: rawToken, password } = parsed.data;

    // ── Hash before lookup ─────────────────────────────────
    const hashed = hashToken(rawToken);

    const securityToken = await db.securityToken.findUnique({
      where: { hashedToken: hashed },
    });

    // Generic error to prevent token enumeration
    if (!securityToken || securityToken.type !== "PASSWORD_RESET") {
      return NextResponse.json(
        { error: "Invalid or expired reset link." },
        { status: 400 },
      );
    }

    if (new Date() > securityToken.expires) {
      await db.securityToken.delete({ where: { id: securityToken.id } });
      return NextResponse.json(
        { error: "Reset link has expired. Please request a new one." },
        { status: 400 },
      );
    }

    const user = await db.user.findUnique({
      where: { email: securityToken.identifier },
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid or expired reset link." }, { status: 400 });
    }

    // ── Hash new password ──────────────────────────────────
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // ── Atomic: update password + bump tokenVersion + delete token ──
    await db.$transaction([
      db.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          tokenVersion: { increment: 1 }, // invalidates all existing JWTs
        },
      }),
      db.securityToken.delete({ where: { id: securityToken.id } }),
    ]);

    // ── Audit ──────────────────────────────────────────────
    logAudit({ userId: user.id, action: "PASSWORD_RESET", ip });

    return NextResponse.json({ message: "Password has been reset successfully" });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
