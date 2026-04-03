import { NextResponse } from "next/server";
import type { z } from "zod";

import { auth } from "@/config/auth";
import { db, isDatabaseConfigured } from "@/config/db";
import { isAdminEmail } from "@/lib/admin";
import type { ErrorResponse } from "@/types/auth";

// ── Re-export db so callers can import { db } from helpers ──
export { db };

/**
 * Guard: database must be configured.
 * Returns a 503 NextResponse on failure, or `null` if OK.
 */
export function requireDb(): NextResponse<ErrorResponse> | null {
  if (!isDatabaseConfigured || !db) {
    return NextResponse.json<ErrorResponse>(
      {
        success: false,
        message:
          "Auth service is not configured on this machine (missing DATABASE_URL).",
      },
      { status: 503 },
    );
  }
  return null;
}

/**
 * Guard: user must be authenticated.
 * Returns the session on success, or a tuple with a 401 response.
 */
export async function requireAuth(): Promise<
  | { session: { user: { id: string; email?: string | null; name?: string | null; image?: string | null } }; error: null }
  | { session: null; error: NextResponse<ErrorResponse> }
> {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      session: null,
      error: NextResponse.json<ErrorResponse>(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      ),
    };
  }
  return { session: session as { user: { id: string; email?: string | null; name?: string | null; image?: string | null } }, error: null };
}

/**
 * Guard: user must be an admin.
 * Returns the session on success, or a tuple with a 403 response.
 */
export async function requireAdmin(): Promise<
  | { session: { user: { id: string; email: string } }; error: null }
  | { session: null; error: NextResponse<ErrorResponse> }
> {
  const session = await auth();
  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    return {
      session: null,
      error: NextResponse.json<ErrorResponse>(
        { success: false, message: "Forbidden" },
        { status: 403 },
      ),
    };
  }
  return { session: session as { user: { id: string; email: string } }, error: null };
}

/**
 * Guard: validate request body with a Zod schema.
 * Returns parsed data on success, or a tuple with a 400 response.
 */
export function validateBody<T extends z.ZodTypeAny>(
  schema: T,
  body: unknown,
): { data: z.infer<T>; error: null } | { data: null; error: NextResponse<ErrorResponse> } {
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    const errors = parsed.error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));

    return {
      data: null,
      error: NextResponse.json<ErrorResponse>(
        { success: false, message: "Validation failed", errors },
        { status: 400 },
      ),
    };
  }

  return { data: parsed.data, error: null };
}
