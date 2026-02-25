import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { auth } from "@/config/auth";
import { db } from "@/config/db";
import { changePasswordSchema } from "@/lib/validations/auth";
import { checkRateLimit, rateLimitResponse, getClientIp } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";
import { SALT_ROUNDS, RL_WINDOW_MS, RL_CHANGE_PW } from "@/lib/constants";
import { ensureTrustedOrigin } from "@/lib/security";

export async function PATCH(req: Request) {
  try {
    const originError = ensureTrustedOrigin(req);
    if (originError) return originError;

    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── Rate limit (per user) ──────────────────────────────
    const ip = getClientIp(req);
    const rl = checkRateLimit(`changepw:${session.user.id}`, RL_CHANGE_PW, RL_WINDOW_MS);
    if (!rl.ok) return rateLimitResponse(rl);

    const body = await req.json();
    const parsed = changePasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { currentPassword, newPassword } = parsed.data;

    // ── Fetch user with password ───────────────────────────
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { password: true },
    });

    if (!user?.password) {
      return NextResponse.json(
        { error: "Your account uses Google Sign-In and has no password to change." },
        { status: 400 },
      );
    }

    // ── Verify current password ────────────────────────────
    const isCorrect = await bcrypt.compare(currentPassword, user.password);
    if (!isCorrect) {
      return NextResponse.json(
        { error: "Current password is incorrect." },
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
    logAudit({ userId: session.user.id, action: "PASSWORD_CHANGED", ip });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json(
      { error: "Failed to change password. Please try again." },
      { status: 500 },
    );
  }
}
