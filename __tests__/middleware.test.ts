import { describe, it, expect } from "vitest";
import authConfig from "@/config/auth.config";

/**
 * Unit-tests for the middleware authorization callback logic.
 *
 * We import the real `authorized` callback from auth.config.ts and
 * wrap it with a thin adapter that builds the NextAuth-shaped args.
 */

const authorizedCallback = authConfig.callbacks!.authorized as (args: {
  auth: { user: Record<string, unknown> } | null;
  request: { nextUrl: URL };
}) => boolean | Response;

function authorized(
  isLoggedIn: boolean,
  pathname: string,
): { allowed: boolean; redirect?: string } {
  const nextUrl = new URL(pathname, "http://localhost:3000");
  const auth = isLoggedIn ? { user: { id: "u1" } } : null;

  const result = authorizedCallback({ auth, request: { nextUrl } });

  if (result instanceof Response) {
    const location = result.headers.get("location") ?? "";
    const redirect = new URL(location).pathname;
    return { allowed: false, redirect };
  }
  return { allowed: result };
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
