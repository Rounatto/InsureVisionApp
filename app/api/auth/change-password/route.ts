import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { requireDb, requireAuth, requireTrustedOrigin, requireRateLimit, validateBody, db } from "@/lib/server/api-helpers";
import { changePasswordSchema } from "@/lib/validations/auth";
import { logAudit } from "@/lib/server/audit";
import { SALT_ROUNDS, RL_CHANGE_PW } from "@/lib/constants";
import { getClientIp } from "@/lib/rate-limit";
import type { ErrorResponse } from "@/types/auth";

export async function PATCH(req: Request) {
  try {
    const originError = requireTrustedOrigin(req);
    if (originError) return originError;

    const dbError = requireDb();
    if (dbError) return dbError;

    const { session, error: authError } = await requireAuth();
    if (authError) return authError;

    // ── Rate limit (per user) ──────────────────────────────
    const rlError = requireRateLimit(req, `changepw:${session.user.id}`, RL_CHANGE_PW);
    if (rlError) return rlError;

    // ── Check if user is banned ─────────────────────────────
    const bannedCheck = await db.user.findUnique({
      where: { id: session.user.id },
      select: { banned: true },
    });

    if (bannedCheck?.banned) {
      return NextResponse.json<ErrorResponse>(
        { success: false, message: "Your account is banned and cannot perform this action." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { data: validated, error: valError } = validateBody(changePasswordSchema, body);
    if (valError) return valError;

    const { currentPassword, newPassword } = validated;

    // ── Fetch user with password ───────────────────────────
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { password: true },
    });

    if (!user?.password) {
      return NextResponse.json<ErrorResponse>(
        { success: false, message: "Your account uses Google Sign-In and has no password to change." },
        { status: 400 },
      );
    }

    // ── Verify current password ────────────────────────
    const isCorrect = await bcrypt.compare(currentPassword, user.password);
    if (!isCorrect) {
      return NextResponse.json<ErrorResponse>(
        { success: false, message: "Current password is incorrect." },
        { status: 400 },
      );
    }

    // ── Hash and save new password + invalidate sessions ───
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await db.user.update({
      where: { id: session.user.id },
      data: {
        password: hashedPassword,
        tokenVersion: { increment: 1 }, // invalidates all existing JWTs
      },
    });

    // ── Audit ──────────────────────────────────────────────
    const ip = getClientIp(req);
    logAudit({ userId: session.user.id, action: "PASSWORD_CHANGED", ip });

    return NextResponse.json({ success: true, message: "Password changed successfully." });
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json<ErrorResponse>(
      { success: false, message: "Failed to change password. Please try again." },
      { status: 500 },
    );
  }
}

