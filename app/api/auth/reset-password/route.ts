import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { db } from "@/config/db";
import { resetPasswordSchema } from "@/lib/validations/auth";
import { SALT_ROUNDS } from "@/lib/constants";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1. Validate input
    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Invalid input";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { token, password } = parsed.data;

    // 2. Find token
    const verificationToken = await db.verificationToken.findFirst({
      where: { token },
    });

    if (!verificationToken) {
      return NextResponse.json(
        { error: "Invalid or expired reset link" },
        { status: 400 }
      );
    }

    // 3. Check if token has expired
    if (new Date() > verificationToken.expires) {
      await db.verificationToken.delete({
        where: {
          identifier_token: {
            identifier: verificationToken.identifier,
            token: verificationToken.token,
          },
        },
      });
      return NextResponse.json(
        { error: "Reset link has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // 4. Find user by email (stored in identifier)
    const user = await db.user.findUnique({
      where: { email: verificationToken.identifier },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 400 }
      );
    }

    // 5. Hash new password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // 6. Update user password
    await db.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // 7. Delete used token
    await db.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: verificationToken.identifier,
          token: verificationToken.token,
        },
      },
    });

    return NextResponse.json({
      message: "Password has been reset successfully",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
