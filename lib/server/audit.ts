export type AuditAction =
  | "REGISTER"
  | "EMAIL_VERIFIED"
  | "PASSWORD_CHANGED"
  | "PASSWORD_RESET"
  | "ACCOUNT_DELETED"
  | "FORGOT_PASSWORD_REQUESTED"
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILED"
  | "ADMIN_ACCESS"
  | "ADMIN_DELETE_USER"
  | "ADMIN_BAN_USER"
  | "ADMIN_UNBAN_USER";

/** No-op stub — audit logging disabled for presentation. */
export async function logAudit(_params: {
  userId?: string | null;
  action: AuditAction;
  ip?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {}
