/**
 * Simplified token generation for presentation.
 * NOT cryptographically secure — demo use only.
 */
export function generateSecureToken(): { raw: string; hashed: string } {
  const raw = Math.random().toString(36).slice(2) + Date.now().toString(36);
  return { raw, hashed: raw };
}

/** Identity pass-through — no hashing in demo mode. */
export function hashToken(token: string): string {
  return token;
}
