import { NextResponse } from "next/server";

import { requireDb, validateBody, db } from "@/lib/server/api-helpers";
import { sendPasswordResetEmail } from "@/lib/server/email";
import { forgotPasswordSchema } from "@/lib/validations/auth";
import { RESET_TOKEN_TTL_MS } from "@/lib/constants";
import { generateSecureToken } from "@/lib/server/tokens";
import { logAudit } from "@/lib/server/audit";
import type { AuthResponse, ErrorResponse } from "@/types/auth";

export async function POST(req: Request) {
  try {
    const dbError = requireDb();
    if (dbError) return dbError;

    const body = await req.json();
    const { data: validated, error: valError } = validateBody(forgotPasswordSchema, body);
    if (valError) return valError;

    const { email } = validated;
    const genericMessage =
      "If an account exists for this email, a reset link has been generated.";

    const user = await db.user.findUnique({
      where: { email },
      select: { email: true },
    });

    if (!user) {
      return NextResponse.json<AuthResponse>(
        { success: true, message: genericMessage },
        { status: 200 }
      );
    }

    // ── Generate hashed reset token ────────────────────────
    const { raw: rawToken, hashed: hashedToken } = generateSecureToken();
    const expires = new Date(Date.now() + RESET_TOKEN_TTL_MS);

    await db.securityToken.deleteMany({
      where: { identifier: user.email, type: "PASSWORD_RESET" },
    });

    await db.securityToken.create({
      data: {
        type: "PASSWORD_RESET",
        hashedToken,
        identifier: user.email,
        expires,
      },
    });

    await sendPasswordResetEmail(user.email, rawToken);

    // ── Audit ────────────────────────────────────────────
    logAudit({ action: "FORGOT_PASSWORD_REQUESTED", metadata: { email: user.email } });
    console.info(`[PASSWORD_RESET_EMAIL_SENT] ${user.email}`);

    return NextResponse.json<AuthResponse>(
      { success: true, message: genericMessage },
      { status: 200 },
    );
  } catch (error) {
    console.error("[FORGOT_PASSWORD_ERROR]", error);

    return NextResponse.json<ErrorResponse>(
      {
        success: false,
        message: "Something went wrong. Please try again later.",
      },
      { status: 500 }
    );
  }
}
