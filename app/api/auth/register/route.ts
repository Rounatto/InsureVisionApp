import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";

import { db } from "@/config/db";
import { registerSchema } from "@/lib/validations/auth";
import type { RegisterResponse, ErrorResponse } from "@/types/auth";

// Coût de hash bcrypt : plus élevé => plus sécurisé mais plus lent.
// 12 est un bon compromis courant pour une API web moderne.
const SALT_ROUNDS = 12;

// =====================================================
// POST /api/auth/register
// =====================================================
// Responsabilité : créer un nouvel utilisateur local (email/password)
//
// Contrat de sortie :
// - 201 : compte créé
// - 400 : validation invalide
// - 409 : email déjà existant
// - 500 : erreur serveur inattendue
export async function POST(req: NextRequest) {
  try {
    // 1. Parse request body
    // Lecture JSON brute envoyée par le frontend
    const body = await req.json();

    // 2. Validate input with Zod
    // safeParse ne lève pas d'exception ; il renvoie { success: boolean, ... }
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      // On transforme les erreurs Zod en format front-friendly :
      // [{ field: "email", message: "Invalid email" }, ...]
      const errors = parsed.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));

      // 400 Bad Request : la requête est mal formée / invalide côté données
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          message: "Validation failed",
          errors,
        },
        { status: 400 }
      );
    }

    // Ici TypeScript sait que les données sont valides selon `registerSchema`
    const { name, email, password } = parsed.data;

    // 3. Check if user already exists
    // Vérification d'unicité email (règle métier critique)
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

    // 4. Hash password
    // IMPORTANT SÉCURITÉ : ne jamais stocker un mot de passe en clair.
    // bcrypt ajoute un sel + hash robuste contre attaques de base.
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // 5. Create user in database
    // On sauvegarde uniquement le hash, jamais le mot de passe original.
    // `select` limite les données retournées (principe de moindre exposition).
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
    // 201 Created + payload minimal pour confirmer la création côté UI
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

    // Message générique volontaire : on évite d'exposer des détails internes
    return NextResponse.json<ErrorResponse>(
      {
        success: false,
        message: "Something went wrong. Please try again later.",
      },
      { status: 500 }
    );
  }
}
