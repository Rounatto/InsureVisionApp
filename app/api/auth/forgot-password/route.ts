import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";

import { db } from "@/config/db";
import { sendPasswordResetEmail } from "@/lib/email/send-password-reset-email";
import { forgotPasswordSchema } from "@/lib/validations/auth";
import type { AuthResponse, ErrorResponse } from "@/types/auth";

const RESET_TOKEN_TTL_MS = 1000 * 60 * 30; // 30 minutes
const PASSWORD_RESET_IDENTIFIER_PREFIX = "password-reset:";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));

      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          message: "Validation failed",
          errors,
        },
        { status: 400 }
      );
    }

    const { email } = parsed.data;
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

    const identifier = `${PASSWORD_RESET_IDENTIFIER_PREFIX}${user.email}`;
    const rawToken = randomBytes(32).toString("hex");
    const hashedToken = createHash("sha256").update(rawToken).digest("hex");
    const expires = new Date(Date.now() + RESET_TOKEN_TTL_MS);

    await db.verificationToken.deleteMany({
      where: { identifier },
    });

    await db.verificationToken.create({
      data: {
        identifier,
        token: hashedToken,
        expires,
      },
    });

    const resetUrl = `${req.nextUrl.origin}/reset-password?token=${rawToken}`;
    await sendPasswordResetEmail({
      to: user.email,
      resetUrl,
    });

    console.info(`[PASSWORD_RESET_EMAIL_SENT] ${user.email}`);

    return NextResponse.json<AuthResponse>(
      {
        success: true,
        message: genericMessage,
        ...(process.env.NODE_ENV !== "production" ? { resetUrl } : {}),
      },
      { status: 200 }
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
