import { db } from "@/config/db";

/**
 * Audit actions — must match the `AuditAction` Prisma enum
 * (generated after migration).
 */
export type AuditAction =
  | "REGISTER"
  | "EMAIL_VERIFIED"
  | "PASSWORD_CHANGED"
  | "PASSWORD_RESET"
  | "ACCOUNT_DELETED"
  | "FORGOT_PASSWORD_REQUESTED"
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILED"
  | "ADMIN_ACCESS";

/**
 * Fire-and-forget audit logger.
 *
 * Failures are swallowed so they never break the main request flow.
 */
export async function logAudit(params: {
  userId?: string | null;
  action: AuditAction;
  ip?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        userId: params.userId ?? null,
        action: params.action,
        ip: params.ip ?? null,
        metadata: params.metadata
          ? (params.metadata as unknown as Parameters<typeof db.auditLog.create>[0]["data"]["metadata"])
          : undefined,
      },
    });
  } catch (err) {
    console.error("[AUDIT_LOG_ERROR]", err);
  }
}
