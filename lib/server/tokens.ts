import crypto from 'crypto';

export function generateSecureToken(): { raw: string; hashed: string } {
  const raw = crypto.randomBytes(32).toString('hex');
  const hashed = hashToken(raw);
  return { raw, hashed };
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token, 'utf8').digest('hex');
}
