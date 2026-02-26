import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { createHash } from "crypto";

import { db, isDatabaseConfigured } from "@/config/db";
import { resetPasswordSchema } from "@/lib/validations/auth";
import type { AuthResponse, ErrorResponse } from "@/types/auth";

const SALT_ROUNDS = 12;
const PASSWORD_RESET_IDENTIFIER_PREFIX = "password-reset:";

export async function POST(req: NextRequest) {
  try {
    if (!isDatabaseConfigured || !db) {
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          message:
            "Auth service is not configured on this machine (missing DATABASE_URL).",
        },
        { status: 503 }
      );
    }

    const body = await req.json();
    const parsed = resetPasswordSchema.safeParse(body);

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

    const { token, password } = parsed.data;
    const hashedToken = createHash("sha256").update(token).digest("hex");

    const resetToken = await db.verificationToken.findFirst({
      where: { token: hashedToken },
    });

    if (!resetToken || resetToken.expires < new Date()) {
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          message: "This reset link is invalid or expired.",
        },
        { status: 400 }
      );
    }

    if (!resetToken.identifier.startsWith(PASSWORD_RESET_IDENTIFIER_PREFIX)) {
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          message: "This reset link is invalid.",
        },
        { status: 400 }
      );
    }

    const email = resetToken.identifier.replace(
      PASSWORD_RESET_IDENTIFIER_PREFIX,
      ""
    );

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
        data: { password: hashedPassword },
      }),
      db.verificationToken.deleteMany({
        where: { identifier: resetToken.identifier },
      }),
    ]);

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
