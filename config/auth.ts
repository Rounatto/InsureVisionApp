import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcrypt";

import { db } from "@/config/db";
import { loginSchema } from "@/lib/validations/auth";

// =====================================================
// CONFIGURATION CENTRALE NEXTAUTH
// =====================================================
// Ce fichier est le cœur de l'authentification :
// - Providers (Google OAuth + Email/Mot de passe)
// - Stratégie de session (JWT)
// - Callbacks (mapping token/session)
//
// Lecture conseillée pour le flux login local :
// 1) `Credentials.authorize()`
// 2) `callbacks.jwt`
// 3) `callbacks.session`
// 4) Utilisation côté pages via `signIn(...)` / `auth()`

export const { handlers, auth, signIn, signOut } = NextAuth({
  // PrismaAdapter relie NextAuth à la base (users, accounts, sessions, etc.)
  adapter: PrismaAdapter(db),
  session: {
    // JWT : pas de table session requise pour stocker l'état de session serveur
    strategy: "jwt",
  },
  pages: {
    // Redirige les utilisateurs non authentifiés vers la page login custom
    signIn: "/login",
  },
  providers: [
    // ─── Google OAuth ──────────────────────────────────────────────────
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),

    // ─── Email / Password ──────────────────────────────────────────────
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // 1) Validation stricte des identifiants entrants
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        // 2) Recherche utilisateur par email
        const user = await db.user.findUnique({
          where: { email },
        });

        // Refuse si compte absent ou sans mot de passe local (ex: OAuth only)
        if (!user || !user.password) return null;

        // 3) Vérification du hash bcrypt
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) return null;

        // 4) Objet utilisateur minimal injecté dans le flux NextAuth
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      // Expose l'ID utilisateur dans `session.user.id` côté client/serveur
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token }) {
      // Callback prêt pour enrichissements futurs (roles, claims personnalisés)
      return token;
    },
  },
});
