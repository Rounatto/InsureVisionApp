import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcrypt";

import authConfig from "@/config/auth.config";
import { db } from "@/config/db";
import { loginSchema } from "@/lib/validations/auth";
import { TOKEN_VERSION_CHECK_INTERVAL_MS } from "@/lib/constants";

export const { handlers, auth } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db),
  session: {
    // JWT : pas de table session requise pour stocker l'état de session serveur
    strategy: "jwt",
  },
  providers: [
    // Google comes from the base config
    ...authConfig.providers,

    // ─── Email / Password (needs Prisma + bcrypt — not Edge-safe) ─────
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

        // Block unverified email users
        if (!user.emailVerified) return null;

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
    ...authConfig.callbacks,

    /**
     * JWT callback — runs on every request.
     *
     * On sign-in (`user` present): persist the current tokenVersion.
     * On subsequent calls: periodically re-check the DB version.
     * If the version has been bumped (password change / reset / delete),
     * the JWT is effectively invalidated by clearing `token.sub`,
     * which causes `session.user.id` to be undefined → 401.
     */
    async jwt({ token, user }) {
      // Initial sign-in — snapshot the current tokenVersion
      if (user?.id) {
        const dbUser = await db.user.findUnique({
          where: { id: user.id },
          select: { tokenVersion: true },
        });
        token.tokenVersion = dbUser?.tokenVersion ?? 0;
        token.versionCheckedAt = Date.now();
        return token;
      }

      // Existing session — periodic version check
      if (token.sub) {
        const lastCheck = (token.versionCheckedAt as number) ?? 0;
        if (Date.now() - lastCheck > TOKEN_VERSION_CHECK_INTERVAL_MS) {
          const dbUser = await db.user.findUnique({
            where: { id: token.sub },
            select: { tokenVersion: true },
          });

          if (!dbUser || dbUser.tokenVersion !== token.tokenVersion) {
            // Token version mismatch → force re-login
            token.sub = undefined;
            token.tokenVersion = undefined;
          }

          token.versionCheckedAt = Date.now();
        }
      }

      return token;
    },

    async session({ session, token }) {
      // Expose l'ID utilisateur dans `session.user.id` côté client/serveur
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
});
