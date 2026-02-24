import NextAuth from "next-auth";
import authConfig from "@/config/auth.config";

/**
 * Edge-safe middleware — uses only the lightweight auth.config.ts
 * (no Prisma / bcrypt / Node-only APIs).
 *
 * The `authorized` callback in auth.config.ts handles the redirect logic.
 */
const { auth: middleware } = NextAuth(authConfig);

export default middleware;

export const config = {
  // Run on all routes except static files and Next.js internals
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
