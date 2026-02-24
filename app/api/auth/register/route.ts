import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import crypto from "crypto";

import { db } from "@/config/db";
import { registerSchema } from "@/lib/validations/auth";
import { SALT_ROUNDS } from "@/lib/constants";
import { sendVerificationEmail } from "@/lib/email";
import type { RegisterResponse, ErrorResponse } from "@/types/auth";

export async function POST(req: Request) {
  try {
    // 1. Parse request body
    const body = await req.json();

    // 2. Validate input with Zod
    const parsed = registerSchema.safeParse(body);

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

    const { name, email, password } = parsed.data;

    // 3. Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          message: "An account with this email already exists",
        },
        { status: 409 }
      );
    }

    // 4. Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // 5. Create user in database
    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    // 6. Create verification token and send email
    const token = crypto.randomUUID();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await db.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires,
      },
    });

    try {
      await sendVerificationEmail(email, token);
    } catch (emailError) {
      console.error("[REGISTER_EMAIL_ERROR]", emailError);
      // User is created but email failed — they can request a new one later
    }

    // 7. Return success response
    return NextResponse.json<RegisterResponse>(
      {
        success: true,
        message: "Account created! Please check your email to verify your account.",
        user: {
          id: user.id,
          name: user.name ?? "",
          email: user.email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[REGISTER_ERROR]", error);

    return NextResponse.json<ErrorResponse>(
      {
        success: false,
        message: "Something went wrong. Please try again later.",
      },
      { status: 500 }
    );
  }
}
