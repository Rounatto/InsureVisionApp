import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcrypt";

import { db, isDatabaseConfigured } from "@/config/db";
import { loginSchema } from "@/lib/validations/auth";

const ONE_DAY_IN_SECONDS = 60 * 60 * 24;
const THIRTY_DAYS_IN_SECONDS = ONE_DAY_IN_SECONDS * 30;

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: db ? PrismaAdapter(db) : undefined,
  session: {
    strategy: "jwt",
    maxAge: THIRTY_DAYS_IN_SECONDS,
  },
  pages: {
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
        remember: { label: "Remember", type: "text" },
      },
      async authorize(credentials) {
        if (!isDatabaseConfigured || !db) return null;

        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const remember = credentials?.remember === "true";

        const user = await db.user.findUnique({
          where: { email },
        });

        if (!user || !user.password) return null;

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          remember,
        };
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        const shouldRemember = Boolean(
          (user as { remember?: boolean }).remember
        );
        const nowInSeconds = Math.floor(Date.now() / 1000);

        (token as { remember?: boolean }).remember = shouldRemember;
        (token as { exp?: number }).exp = nowInSeconds + (
          shouldRemember ? THIRTY_DAYS_IN_SECONDS : ONE_DAY_IN_SECONDS
        );
      }

      return token;
    },
  },
});
