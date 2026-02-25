import { NextResponse } from "next/server";
import bcrypt from "bcrypt";

import { db } from "@/config/db";
import { registerSchema } from "@/lib/validations/auth";
import { SALT_ROUNDS, RL_WINDOW_MS, RL_REGISTER, VERIFY_TOKEN_TTL_MS } from "@/lib/constants";
import { sendVerificationEmail } from "@/lib/email";
import { generateSecureToken } from "@/lib/tokens";
import { checkRateLimit, rateLimitResponse, getClientIp } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";
import type { RegisterResponse, ErrorResponse } from "@/types/auth";
import { ensureTrustedOrigin } from "@/lib/security";

export async function POST(req: Request) {
  try {
    const originError = ensureTrustedOrigin(req);
    if (originError) return originError;

    // ── Rate limit (IP-based) ──────────────────────────────
    const ip = getClientIp(req);
    const rl = checkRateLimit(`register:${ip}`, RL_REGISTER, RL_WINDOW_MS);
    if (!rl.ok) return rateLimitResponse(rl);

    // ── Parse & validate ───────────────────────────────────
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));

      return NextResponse.json<ErrorResponse>(
        { success: false, message: "Validation failed", errors },
        { status: 400 },
      );
    }

    const { name, email, password } = parsed.data;

    // ── Check duplicate ────────────────────────────────────
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json<ErrorResponse>(
        { success: false, message: "An account with this email already exists" },
        { status: 409 },
      );
    }

    // ── Hash password ──────────────────────────────────────
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // ── Generate hashed verification token ─────────────────
    const { raw: rawToken, hashed: hashedToken } = generateSecureToken();
    const expires = new Date(Date.now() + VERIFY_TOKEN_TTL_MS);

    // ── Atomic: create user + security token ───────────────
    const user = await db.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: { name, email, password: hashedPassword },
        select: { id: true, name: true, email: true },
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

    // ── Send verification email (non-blocking on failure) ──
    try {
      await sendVerificationEmail(email, rawToken);
    } catch (emailError) {
      console.error("[REGISTER_EMAIL_ERROR]", emailError);
    }

    // ── Audit ──────────────────────────────────────────────
    logAudit({ userId: user.id, action: "REGISTER", ip });

    return NextResponse.json<RegisterResponse>(
      {
        success: true,
        message: "Account created! Please check your email to verify your account.",
        user: { id: user.id, name: user.name ?? "", email: user.email },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[REGISTER_ERROR]", error);
    return NextResponse.json<ErrorResponse>(
      { success: false, message: "Something went wrong. Please try again later." },
      { status: 500 },
    );
  }
}
