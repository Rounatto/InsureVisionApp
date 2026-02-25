import crypto from "crypto";

/**
 * Generate a cryptographically secure token pair.
 *
 * - `raw`    → sent to the user (email link).
 * - `hashed` → stored in the database (SHA-256).
 *
 * Even if an attacker obtains a full DB dump, the raw token
 * cannot be recovered from the hash.
 */
export function generateSecureToken(): { raw: string; hashed: string } {
  const raw = crypto.randomBytes(32).toString("hex");
  const hashed = hashToken(raw);
  return { raw, hashed };
}

/**
 * SHA-256 hash a token string.
 * Used before storing AND before looking up.
 */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token, "utf8").digest("hex");
}
