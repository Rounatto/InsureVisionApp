/** Number of salt rounds used for bcrypt password hashing. */
export const SALT_ROUNDS = 12;

/** Generic network-error message shown in catch blocks. */
export const NETWORK_ERROR_MESSAGE =
  "Unable to connect to the server. Please try again later.";

/* ─── Token lifetimes ────────────────────────────────────── */

/** Email-verification token lifetime (24 h). */
export const VERIFY_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

/** Password-reset token lifetime (1 h). */
export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;
