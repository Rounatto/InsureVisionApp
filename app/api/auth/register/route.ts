import { NextResponse } from "next/server";
import bcrypt from "bcrypt";

import { requireDb, validateBody, db } from "@/lib/server/api-helpers";
import { registerSchema } from "@/lib/validations/auth";
import { SALT_ROUNDS, VERIFY_TOKEN_TTL_MS } from "@/lib/constants";
import { generateSecureToken } from "@/lib/server/tokens";
import { sendVerificationEmail } from "@/lib/server/email";
import { logAudit } from "@/lib/server/audit";
import type { RegisterResponse, ErrorResponse } from "@/types/auth";

export async function POST(req: Request) {
  try {
    const dbError = requireDb();
    if (dbError) return dbError;

    // ── Parse & validate ───────────────────────────────────
    const body = await req.json();
    const { data: validated, error: valError } = validateBody(registerSchema, body);
    if (valError) return valError;

    const { name, email, password } = validated;

    // ── Check duplicate ────────────────────────────────────
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      // 409 Conflict : ressource déjà existante selon contrainte métier
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          message: "An account with this email already exists",
        },
        { status: 409 }
      );
    }

    // ── Hash password ──────────────────────────────────────
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // ── Generate verification token ────────────────────────
    const { raw: rawToken, hashed: hashedToken } = generateSecureToken();
    const expires = new Date(Date.now() + VERIFY_TOKEN_TTL_MS);

    // ── Atomic: create user + verification token ───────────
    const user = await db.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
        },
        select: { id: true, name: true, email: true },
      });

      await tx.securityToken.deleteMany({
        where: { identifier: email, type: "EMAIL_VERIFICATION" },
      });

      await tx.securityToken.create({
        data: {
          type: "EMAIL_VERIFICATION",
          hashedToken,
          identifier: email,
          expires,
        },
      });

      return newUser;
    });

    try {
      await sendVerificationEmail(email, rawToken);
    } catch (emailError) {
      console.error("[REGISTER_EMAIL_ERROR]", emailError);

      // Keep auth state consistent: if verification mail cannot be sent,
      // remove the newly created account + token and surface an error.
      await db.$transaction(async (tx) => {
        await tx.securityToken.deleteMany({
          where: { identifier: email, type: "EMAIL_VERIFICATION" },
        });
        await tx.user.delete({ where: { id: user.id } });
      });

      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          message: "Unable to send verification email. Please check email configuration and try again.",
        },
        { status: 502 }
      );
    }

    // ── Audit ──────────────────────────────────────────────
    logAudit({ userId: user.id, action: "REGISTER" });

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
    // Logging serveur (visible dans logs backend), utile pour debug prod/dev
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
