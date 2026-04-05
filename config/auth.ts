import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcrypt';

import authConfig from '@/config/auth.config';
import { db, isDatabaseConfigured } from '@/config/db';
import { loginSchema } from '@/lib/validations/auth';
import { isAdminEmail } from '@/lib/admin';

export const { handlers, auth } = NextAuth({
  ...authConfig,
  adapter: db ? PrismaAdapter(db) : undefined,
  session: {
    strategy: 'jwt',
  },
  // Session cookie (no persistent maxAge) so users must sign in again
  // after closing the browser.
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === 'production'
          ? '__Secure-authjs.session-token'
          : 'authjs.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  providers: [
    // Google comes from the base config
    ...authConfig.providers,

    // Email / Password (needs Prisma + bcrypt - not Edge-safe)
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
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
        if (user.banned) return null;
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
  events: {
    async linkAccount({ user, account }) {
      // Treat Google OAuth linking as verified ownership of the email.
      if (!isDatabaseConfigured || !db) return;
      if (account?.provider !== 'google') return;
      if (!user?.id) return;

      try {
        await db.user.update({
          where: { id: user.id },
          data: { emailVerified: new Date() },
        });
      } catch (error) {
        console.warn('OAuth linkAccount emailVerified update skipped:', error);
      }
    },
  },
  callbacks: {
    ...authConfig.callbacks,

    async signIn({ user }) {
      if (!isDatabaseConfigured || !db) return true;

      const userEmail = user.email?.trim();
      if (!userEmail) return false;

      const dbUser = await db.user.findUnique({
        where: { email: userEmail },
        select: { banned: true },
      });

      return !dbUser?.banned;
    },

    async jwt({ token, user, trigger, session, account }) {
      // On Google sign-in, strip the Google profile image so the app
      // always uses its own letter avatar — also clear it in the DB for
      // existing users who already have a Google image stored.
      if (account?.provider === 'google' && user) {
        token.image = null;
        if (user.id && db) {
          try {
            await db.user.update({
              where: { id: user.id },
              data: { image: null },
            });
          } catch {
            // non-critical, ignore
          }
        }
      }

      // Client-driven session updates (e.g. useSession().update({ name }))
      if (trigger === 'update') {
        if (typeof session?.name === 'string') token.name = session.name;
        if (typeof session?.image === 'string') token.image = session.image;
        token.isAdmin = isAdminEmail(
          typeof token.email === 'string' ? token.email : undefined
        );
        return token;
      }

      token.isAdmin = isAdminEmail(
        typeof user?.email === 'string'
          ? user.email
          : typeof token.email === 'string'
            ? token.email
            : undefined
      );

      return token;
    },

    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
        session.user.name = token.name ?? session.user.name;
        session.user.email = token.email ?? session.user.email;
        session.user.image =
          'image' in token
            ? (token.image as string | null)
            : session.user.image;
        session.user.isAdmin = (token.isAdmin as boolean | undefined) ?? false;
      }
      return session;
    },
  },
});
