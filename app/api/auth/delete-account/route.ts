import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { auth } from "@/config/auth";
import { db } from "@/config/db";
import { logAudit } from "@/lib/audit";
import { getClientIp } from "@/lib/rate-limit";

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
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const ip = getClientIp(req);

    // ── Password re-confirmation for credential accounts ───
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { password: true, email: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.password) {
      // Credential account — require password in body
      let body: { password?: string } = {};
      try {
        body = await req.json();
      } catch {
        return NextResponse.json(
          { error: "Password confirmation is required to delete your account." },
          { status: 400 },
        );
      }

      if (!body.password) {
        return NextResponse.json(
          { error: "Password confirmation is required to delete your account." },
          { status: 400 },
        );
      }

      const match = await bcrypt.compare(body.password, user.password);
      if (!match) {
        return NextResponse.json(
          { error: "Incorrect password." },
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
    logAudit({ userId, action: "ACCOUNT_DELETED", ip });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete account error:", error);
    return NextResponse.json(
      { error: "Failed to delete account. Please try again." },
      { status: 500 },
    );
  }
}
