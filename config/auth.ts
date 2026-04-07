import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcrypt';
import { cookies } from 'next/headers';

import authConfig from '@/config/auth.config';
import { db, isDatabaseConfigured } from '@/config/db';
import { loginSchema } from '@/lib/validations/auth';
import { TOKEN_VERSION_CHECK_INTERVAL_MS } from '@/lib/constants';
import { isAdminEmail } from '@/lib/admin';

const REMEMBER_ME_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;
const NON_REMEMBER_MAX_AGE_SECONDS = 12 * 60 * 60;
const REMEMBER_ME_PREF_COOKIE = 'iv_remember_me';

function readRememberPreferenceFromCookie(): boolean | undefined {
  try {
    const value = cookies().get(REMEMBER_ME_PREF_COOKIE)?.value;
    if (value === '1' || value === 'true') return true;
    if (value === '0' || value === 'false') return false;
    return undefined;
  } catch {
    return undefined;
  }
}

export const { handlers, auth } = NextAuth({
  ...authConfig,
  adapter: db ? PrismaAdapter(db) : undefined,
  session: {
    strategy: 'jwt',
    maxAge: REMEMBER_ME_MAX_AGE_SECONDS,
  },
  // Keep a persistent cookie by default, then use per-token TTL in the JWT
  // callback so "Remember me" can shorten credentials sessions when unchecked.
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
        maxAge: REMEMBER_ME_MAX_AGE_SECONDS,
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
        remember: { label: 'Remember', type: 'text' },
      },
      async authorize(credentials) {
        if (!isDatabaseConfigured || !db) return null;

        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const rememberMe =
          credentials?.remember === 'true' || credentials?.remember === true;

        const user = await db.user.findUnique({
          where: { email },
        });

        if (!user || !user.password) return null;
        if (user.banned) return null;

        // Block unverified email users
        if (!user.emailVerified) return null;

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          rememberMe,
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

    /**
     * JWT callback runs on every request.
     * Uses tokenVersion to invalidate sessions after password changes.
     */
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
        return token;
      }

      // Initial sign-in: snapshot tokenVersion
      if (user?.id) {
        const rememberFromUser = (user as { rememberMe?: boolean }).rememberMe;
        const rememberMe =
          rememberFromUser ??
          (account?.provider === 'google'
            ? readRememberPreferenceFromCookie()
            : undefined);
        try {
          const dbUser = await db.user.findUnique({
            where: { id: user.id },
            select: { tokenVersion: true },
          });
          token.tokenVersion = dbUser?.tokenVersion ?? 0;
        } catch (error) {
          console.warn('JWT sign-in tokenVersion check skipped:', error);
          token.tokenVersion = 0;
        }
        token.rememberMe = rememberMe ?? true;
        token.exp =
          Math.floor(Date.now() / 1000) +
          (token.rememberMe
            ? REMEMBER_ME_MAX_AGE_SECONDS
            : NON_REMEMBER_MAX_AGE_SECONDS);
        token.isAdmin = isAdminEmail(user.email);
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
            console.warn('JWT periodic tokenVersion check skipped:', error);
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
