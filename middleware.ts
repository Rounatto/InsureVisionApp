import NextAuth from "next-auth";
import authConfig from "@/config/auth.config";
import { NextResponse } from "next/server";

/**
 * Edge-safe middleware — uses only the lightweight auth.config.ts
 * (no Prisma / bcrypt / Node-only APIs).
 *
 * The `authorized` callback in auth.config.ts handles the redirect logic.
 */
const { auth: authMiddleware } = NextAuth(authConfig);

function applySecurityHeaders(res: NextResponse) {
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("X-DNS-Prefetch-Control", "off");
  res.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  res.headers.set("Cross-Origin-Resource-Policy", "same-site");
  res.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  );

  if (process.env.NODE_ENV === "production") {
    res.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload",
    );
  }
}

export default authMiddleware((req) => {
  const res = NextResponse.next({ request: { headers: req.headers } });
  applySecurityHeaders(res);
  return res;
});

export const config = {
  // Run on all routes except static files and Next.js internals
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
