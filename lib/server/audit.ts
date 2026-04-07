import { db } from '@/config/db';

export type AuditAction =
  | 'REGISTER'
  | 'EMAIL_VERIFIED'
  | 'PASSWORD_CHANGED'
  | 'PASSWORD_RESET'
  | 'ACCOUNT_DELETED'
  | 'FORGOT_PASSWORD_REQUESTED'
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'ADMIN_ACCESS'
  | 'ADMIN_DELETE_USER'
  | 'ADMIN_BAN_USER'
  | 'ADMIN_UNBAN_USER'
  | 'BANNED_USER_MESSAGE_SENT'
  | 'ADMIN_MESSAGE_SENT';

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
          ? (params.metadata as unknown as Parameters<
              typeof db.auditLog.create
            >[0]['data']['metadata'])
          : undefined,
      },
    });
  } catch (err) {
    console.error('[AUDIT_LOG_ERROR]', err);
  }
}
