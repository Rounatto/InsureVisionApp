import { NextResponse } from "next/server";
import { db } from "@/config/db";
import { forgotPasswordSchema } from "@/lib/validations/auth";
import { sendPasswordResetEmail } from "@/lib/email";
import { generateSecureToken } from "@/lib/tokens";
import { checkRateLimit, rateLimitResponse, getClientIp } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";
import { RL_WINDOW_MS, RL_FORGOT_PW, RESET_TOKEN_TTL_MS } from "@/lib/constants";
import { ensureTrustedOrigin } from "@/lib/security";

/** Enumeration-safe message returned on every path. */
const SAFE_MSG = "If an account exists with that email, a reset link has been sent.";

export async function POST(req: Request) {
  try {
    const originError = ensureTrustedOrigin(req);
    if (originError) return originError;

    // ── Rate limit (IP + email) ────────────────────────────
    const ip = getClientIp(req);
    const rlIp = checkRateLimit(`forgot:${ip}`, RL_FORGOT_PW, RL_WINDOW_MS);
    if (!rlIp.ok) return rateLimitResponse(rlIp);

    const body = await req.json();
    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 });
    }

    const { email } = parsed.data;

    // Secondary rate limit keyed on email
    const rlEmail = checkRateLimit(`forgot:${email}`, RL_FORGOT_PW, RL_WINDOW_MS);
    if (!rlEmail.ok) return NextResponse.json({ message: SAFE_MSG });

    // ── Find user (always return same message) ─────────────
    const user = await db.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ message: SAFE_MSG });
    }

    // ── Generate hashed token ──────────────────────────────
    const { raw: rawToken, hashed: hashedToken } = generateSecureToken();
    const expires = new Date(Date.now() + RESET_TOKEN_TTL_MS);

    // ── Atomic: delete old tokens + create new one ─────────
    await db.$transaction([
      db.securityToken.deleteMany({
        where: { identifier: email, type: "PASSWORD_RESET" },
      }),
      db.securityToken.create({
        data: {
          type: "PASSWORD_RESET",
          hashedToken,
          identifier: email,
          expires,
        },
      }),
    ]);

    // ── Send reset email ───────────────────────────────────
    try {
      await sendPasswordResetEmail(email, rawToken);
    } catch (emailError) {
      console.error("Failed to send reset email:", emailError);
    }

    // ── Audit ──────────────────────────────────────────────
    logAudit({ userId: user.id, action: "FORGOT_PASSWORD_REQUESTED", ip });

    return NextResponse.json({ message: SAFE_MSG });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
