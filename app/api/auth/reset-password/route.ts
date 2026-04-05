import { NextResponse } from "next/server";
import bcrypt from "bcrypt";

import { requireDb, requireRateLimit, validateBody, db } from "@/lib/api-helpers";
import { resetPasswordSchema } from "@/lib/validations/auth";
import { RL_RESET_PW, SALT_ROUNDS } from "@/lib/constants";
import { hashToken } from "@/lib/tokens";
import { logAudit } from "@/lib/audit";
import { getClientIp } from "@/lib/rate-limit";
import type { AuthResponse, ErrorResponse } from "@/types/auth";

export async function POST(req: Request) {
  try {
    // ── Rate limit (IP-based) ──────────────────────────────
    const rlError = requireRateLimit(req, "resetpw", RL_RESET_PW);
    if (rlError) return rlError;

    const dbError = requireDb();
    if (dbError) return dbError;

    const body = await req.json();
    const { data: validated, error: valError } = validateBody(resetPasswordSchema, body);
    if (valError) return valError;

    const { token, password } = validated;
    const hashedTokenValue = hashToken(token);

    const resetToken = await db.securityToken.findFirst({
      where: { hashedToken: hashedTokenValue, type: "PASSWORD_RESET" },
    });

    if (!resetToken || resetToken.expires < new Date()) {
      // Clean up expired token if it exists
      if (resetToken) {
        await db.securityToken.delete({ where: { id: resetToken.id } }).catch(() => {});
      }
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          message: "This reset link is invalid or expired.",
        },
        { status: 400 }
      );
    }

    const email = resetToken.identifier;

    const user = await db.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          message: "This reset link is invalid.",
        },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    await db.$transaction([
      db.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          tokenVersion: { increment: 1 }, // invalidates all existing JWTs
        },
      }),
      db.securityToken.deleteMany({
        where: { identifier: email, type: "PASSWORD_RESET" },
      }),
    ]);

    // ── Audit ──────────────────────────────────────────────
    const ip = getClientIp(req);
    logAudit({ userId: user.id, action: "PASSWORD_RESET", ip });

    return NextResponse.json<AuthResponse>(
      {
        success: true,
        message: "Password updated successfully. You can now sign in.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[RESET_PASSWORD_ERROR]", error);

    return NextResponse.json<ErrorResponse>(
      {
        success: false,
        message: "Something went wrong. Please try again later.",
      },
      { status: 500 }
    );
  }
}
