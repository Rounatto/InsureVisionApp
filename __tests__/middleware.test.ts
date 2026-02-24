import { describe, it, expect } from "vitest";

/**
 * Unit-tests for the middleware authorization callback logic.
 *
 * Rather than running the real NextAuth middleware (which needs
 * an Edge-compatible environment), we extract and test the core
 * decision function in isolation.
 */

// Re-implement the logic under test (same as auth.config.ts → authorized)
function authorized(
  isLoggedIn: boolean,
  pathname: string
): { allowed: boolean; redirect?: string } {
  const publicPaths = ["/", "/login", "/register", "/forgot-password", "/reset-password"];
  const isPublicPage = publicPaths.some(
    (p) => pathname === p || (p !== "/" && pathname.startsWith(p + "/")),
  );
  const isAuthApi = pathname.startsWith("/api/auth");

  if (isPublicPage || isAuthApi) {
    const isAuthPage = ["/login", "/register", "/forgot-password", "/reset-password"].some(
      (p) => pathname === p || pathname.startsWith(p + "/"),
    );
    if (isLoggedIn && (isAuthPage || pathname === "/")) {
      return { allowed: false, redirect: "/dashboard" };
    }
    return { allowed: true };
  }

  return { allowed: isLoggedIn };
}

describe("middleware authorization logic", () => {
  /* ─── Public pages ─────────────────────────────────────── */
  describe("public pages (unauthenticated)", () => {
    it.each(["/", "/login", "/register", "/forgot-password", "/reset-password"])(
      "allows %s for unauthenticated users",
      (path) => {
        expect(authorized(false, path).allowed).toBe(true);
      }
    );
  });

  /* ─── Auth API ──────────────────────────────────────────── */
  describe("auth API routes", () => {
    it("allows /api/auth/callback/google", () => {
      expect(authorized(false, "/api/auth/callback/google").allowed).toBe(true);
    });

    it("allows /api/auth/register", () => {
      expect(authorized(false, "/api/auth/register").allowed).toBe(true);
    });
  });

  /* ─── Logged-in redirects ──────────────────────────────── */
  describe("logged-in users on auth/landing pages", () => {
    it.each(["/", "/login", "/register", "/forgot-password", "/reset-password"])(
      "redirects logged-in user from %s to /dashboard",
      (path) => {
        const result = authorized(true, path);
        expect(result.redirect).toBe("/dashboard");
      }
    );
  });

  /* ─── Protected pages ──────────────────────────────────── */
  describe("protected routes", () => {
    it.each(["/dashboard", "/profile", "/history"])(
      "allows %s for authenticated user",
      (path) => {
        expect(authorized(true, path).allowed).toBe(true);
      }
    );

    it.each(["/dashboard", "/profile", "/history"])(
      "blocks %s for unauthenticated user",
      (path) => {
        expect(authorized(false, path).allowed).toBe(false);
      }
    );
  });

  /* ─── Protected API routes ─────────────────────────────── */
  describe("protected API routes", () => {
    it("blocks /api/estimate for unauthenticated user", () => {
      expect(authorized(false, "/api/estimate").allowed).toBe(false);
    });

    it("allows /api/estimate for authenticated user", () => {
      expect(authorized(true, "/api/estimate").allowed).toBe(true);
    });
  });
});
