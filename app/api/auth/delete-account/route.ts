import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { requireDb, requireAuth, requireTrustedOrigin, requireRateLimit, db } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";
import { getClientIp } from "@/lib/rate-limit";
import { RL_DELETE_ACCOUNT } from "@/lib/constants";
import type { ErrorResponse } from "@/types/auth";

/**
 * DELETE /api/auth/delete-account
 *
 * Body: `{ password: string }` (required for credential accounts).
 * OAuth-only accounts (no password) are deleted with session auth alone.
 *
 * Wraps the deletion in a transaction. Cascading relations
 * (Account, Session, Estimate → EstimatePart) are handled by the DB.
 * tokenVersion bump is unnecessary because the row is deleted.
 */
export async function DELETE(req: Request) {
  try {
    const originError = requireTrustedOrigin(req);
    if (originError) return originError;

    const dbError = requireDb();
    if (dbError) return dbError;

    const { session, error: authError } = await requireAuth();
    if (authError) return authError;

    const userId = session.user.id;
    const rlError = requireRateLimit(req, `delete-account:${userId}`, RL_DELETE_ACCOUNT);
    if (rlError) return rlError;

    // ── Password re-confirmation for credential accounts ───
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { password: true, email: true },
    });

    if (!user) {
      return NextResponse.json<ErrorResponse>(
        { success: false, message: "User not found" },
        { status: 404 },
      );
    }

    if (user.password) {
      // Credential account — require password in body
      let body: { password?: string } = {};
      try {
        body = await req.json();
      } catch {
        return NextResponse.json<ErrorResponse>(
          { success: false, message: "Password confirmation is required to delete your account." },
          { status: 400 },
        );
      }

      if (!body.password) {
        return NextResponse.json<ErrorResponse>(
          { success: false, message: "Password confirmation is required to delete your account." },
          { status: 400 },
        );
      }

      const match = await bcrypt.compare(body.password, user.password);
      if (!match) {
        return NextResponse.json<ErrorResponse>(
          { success: false, message: "Incorrect password." },
          { status: 400 },
        );
      }
    }

    // ── Atomic delete (cascades handle related rows) ───────
    await db.$transaction([
      db.securityToken.deleteMany({ where: { identifier: user.email } }),
      db.user.delete({ where: { id: userId } }),
    ]);

    // ── Audit (userId will no longer exist, but we log it for records) ───
    const ip = getClientIp(req);
    logAudit({ userId, action: "ACCOUNT_DELETED", ip });

    return NextResponse.json({ success: true, message: "Account deleted successfully." });
  } catch (error) {
    console.error("Delete account error:", error);
    return NextResponse.json<ErrorResponse>(
      { success: false, message: "Failed to delete account. Please try again." },
      { status: 500 },
    );
  }
}
