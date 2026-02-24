import { NextResponse } from "next/server";
import bcrypt from "bcrypt";

import { db } from "@/config/db";
import { registerSchema } from "@/lib/validations/auth";
import { SALT_ROUNDS } from "@/lib/constants";
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

    // 6. Return success response
    return NextResponse.json<RegisterResponse>(
      {
        success: true,
        message: "Account created successfully",
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
