import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcrypt";

import authConfig from "@/config/auth.config";
import { db, isDatabaseConfigured } from "@/config/db";
import { loginSchema } from "@/lib/validations/auth";
import { TOKEN_VERSION_CHECK_INTERVAL_MS } from "@/lib/constants";

export const { handlers, auth } = NextAuth({
  ...authConfig,
  adapter: db ? PrismaAdapter(db) : undefined,
  session: {
    strategy: "jwt",
  },
  // Session cookie (no persistent maxAge) so users must sign in again
  // after closing the browser.
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-authjs.session-token"
          : "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  providers: [
    // Google comes from the base config
    ...authConfig.providers,

    // Email / Password (needs Prisma + bcrypt - not Edge-safe)
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!isDatabaseConfigured || !db) return null;

        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const user = await db.user.findUnique({
          where: { email },
        });

        if (!user || !user.password) return null;
        if (!user.emailVerified) return null;

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) return null;

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
     * JWT callback runs on every request.
     * Uses tokenVersion to invalidate sessions after password changes.
     */
    async jwt({ token, user, trigger, session }) {
      // Client-driven session updates (e.g. useSession().update({ name }))
      if (trigger === "update") {
        if (typeof session?.name === "string") token.name = session.name;
        if (typeof session?.image === "string") token.image = session.image;
        return token;
      }

      // Initial sign-in: snapshot tokenVersion
      if (user?.id) {
        try {
          const dbUser = await db.user.findUnique({
            where: { id: user.id },
            select: { tokenVersion: true },
          });
          token.tokenVersion = dbUser?.tokenVersion ?? 0;
        } catch (error) {
          console.warn("JWT sign-in tokenVersion check skipped:", error);
          token.tokenVersion = 0;
        }
        token.versionCheckedAt = Date.now();
        return token;
      }

      // Existing session: periodic version check
      if (token.sub) {
        const lastCheck = (token.versionCheckedAt as number) ?? 0;
        if (Date.now() - lastCheck > TOKEN_VERSION_CHECK_INTERVAL_MS) {
          try {
            const dbUser = await db.user.findUnique({
              where: { id: token.sub },
              select: { tokenVersion: true },
            });

            if (!dbUser || dbUser.tokenVersion !== token.tokenVersion) {
              token.sub = undefined;
              token.tokenVersion = undefined;
            }
          } catch (error) {
            console.warn("JWT periodic tokenVersion check skipped:", error);
          }

          token.versionCheckedAt = Date.now();
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
        session.user.name = token.name ?? session.user.name;
        session.user.email = token.email ?? session.user.email;
        session.user.image = token.image ?? session.user.image;
      }
      return session;
    },
  },
});
