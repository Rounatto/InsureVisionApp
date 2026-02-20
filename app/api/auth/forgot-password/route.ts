import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/config/db";
import { forgotPasswordSchema } from "@/lib/validations/auth";

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

    // 7. Build reset URL
    const resetUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/reset-password?token=${token}`;

    // 8. TODO: Send email via Resend / SendGrid / Nodemailer
    //    For now, log to console so the flow is testable in development
    console.log("─────────────────────────────────────────");
    console.log("🔑 Password Reset Link:");
    console.log(resetUrl);
    console.log("─────────────────────────────────────────");

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
