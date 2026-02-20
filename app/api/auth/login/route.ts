import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";

import { db } from "@/config/db";
import { loginSchema } from "@/lib/validations/auth";
import type { LoginResponse, ErrorResponse } from "@/types/auth";
// =====================================================
// POST /api/auth/login
// =====================================================
// Responsabilité : authentifier un utilisateur existant (email/password)
//
// Contrat de sortie :
// - 200 : login réussi
// - 400 : validation invalide
// - 401 : identifiants incorrects
// - 500 : erreur serveur inattendue
export async function POST(req: NextRequest) {
  try {
    // 1. Parse request body
    // Lecture JSON brute envoyée par le frontend
    const body = await req.json();

    // 2. Validate input with Zod
    const parsed = loginSchema.safeParse(body);

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

    // Données validées
    const { email, password } = parsed.data;

    // 3. Check if user exists
    const user = await db.user.findUnique({
      where: { email },
    });

    // Important : on ne précise pas si email ou password est faux
    // pour éviter les attaques par enumeration.
    if (!user || !user.password) {
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          message: "Invalid email or password",
        },
        { status: 401 }
      );
    }

    // 4. Compare password
    // bcrypt compare le mot de passe envoyé avec le hash stocké
    const isPasswordValid = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordValid) {
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          message: "Invalid email or password",
        },
        { status: 401 }
      );
    }

    // 5. Return success response
    // On ne renvoie jamais le password ni le hash.
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