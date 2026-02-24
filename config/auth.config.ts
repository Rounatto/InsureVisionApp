import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

/**
 * Edge-safe auth config (no Prisma / bcrypt / Node APIs).
 * Used by middleware. The full config in auth.ts spreads this
 * and adds the Prisma adapter + Credentials provider.
 */
const authConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;

      const publicPaths = ["/login", "/register", "/forgot-password", "/reset-password"];
      const isPublicPage = publicPaths.some(
        (p) => nextUrl.pathname === p || nextUrl.pathname.startsWith(p + "/"),
      );
      const isAuthApi = nextUrl.pathname.startsWith("/api/auth");

      // Allow public pages & auth API routes
      if (isPublicPage || isAuthApi) {
        // Redirect logged-in users away from auth pages
        if (isLoggedIn && isPublicPage) {
          return Response.redirect(new URL("/", nextUrl));
        }
        return true;
      }

      // Block unauthenticated users (NextAuth auto-redirects to signIn page)
      return isLoggedIn;
    },
  },
} satisfies NextAuthConfig;

export default authConfig;
