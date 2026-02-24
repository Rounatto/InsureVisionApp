import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/config/db";
import { forgotPasswordSchema } from "@/lib/validations/auth";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    // 1. Parse body
    const body = await req.json();

    // 2. Validate
    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    const { email } = parsed.data;

    // 3. Find user (always return success to prevent email enumeration)
    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({
        message:
          "If an account exists with that email, a reset link has been sent.",
      });
    }

    // 4. Delete any existing reset tokens for this email
    await db.verificationToken.deleteMany({
      where: { identifier: email },
    });

    // 5. Generate token
    const token = crypto.randomUUID();
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // 6. Store token
    await db.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires,
      },
    });

    // 7. Send reset email
    try {
      await sendPasswordResetEmail(email, token);
    } catch (emailError) {
      console.error("Failed to send reset email:", emailError);
    }

    return NextResponse.json({
      message:
        "If an account exists with that email, a reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
