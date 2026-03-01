import { NextResponse } from "next/server";
import { requireDb, requireAuth, requireTrustedOrigin, requireRateLimit, db } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";
import { getClientIp } from "@/lib/rate-limit";
import { RL_DELETE_ACCOUNT } from "@/lib/constants";
import type { ErrorResponse } from "@/types/auth";

/**
 * DELETE /api/auth/delete-account
 *
 * Deletes the authenticated user's account.
 * Requires only a valid session — no password needed.
 *
 * Wraps the deletion in a transaction. Cascading relations
 * (Account, Session, Estimate → EstimatePart) are handled by the DB.
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

    // ── Fetch user email for security token cleanup ───
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user) {
      return NextResponse.json<ErrorResponse>(
        { success: false, message: "User not found" },
        { status: 404 },
      );
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
