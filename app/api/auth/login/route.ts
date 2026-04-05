import { NextResponse } from "next/server";
import bcrypt from "bcrypt";

import { requireDb, validateBody, db } from "@/lib/server/api-helpers";
import { loginSchema } from "@/lib/validations/auth";
import { logAudit } from "@/lib/server/audit";
import type { LoginResponse, ErrorResponse } from "@/types/auth";
// =====================================================
// POST /api/auth/login
// =====================================================
export async function POST(req: Request) {
  try {
    const dbError = requireDb();
    if (dbError) return dbError;

    const body = await req.json();
    const { data: validated, error: valError } = validateBody(loginSchema, body);
    if (valError) return valError;

    const { email, password } = validated;

    // Check if user exists (generic message to prevent enumeration)
    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user || !user.password) {
      logAudit({ action: "LOGIN_FAILED", metadata: { email } });
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          message: "Invalid email or password",
        },
        { status: 401 }
      );
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordValid) {
      logAudit({ action: "LOGIN_FAILED", metadata: { email } });
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          message: "Invalid email or password",
        },
        { status: 401 }
      );
    }

    // ── Audit ──────────────────────────────────────────────
    logAudit({ userId: user.id, action: "LOGIN_SUCCESS" });

    return NextResponse.json<LoginResponse>(
      {
        success: true,
        message: "Login successful",
        user:{
          id: user.id,
          name: user.name ?? "",
          email: user.email,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[LOGIN_ERROR]", error);

    return NextResponse.json<ErrorResponse>(
      {
        success: false,
        message: "Something went wrong. Please try again later.",
      },
      { status: 500 }
    );
  }
}
