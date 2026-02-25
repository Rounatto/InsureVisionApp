/** Number of salt rounds used for bcrypt password hashing. */
export const SALT_ROUNDS = 12;

/** Generic network-error message shown in catch blocks. */
export const NETWORK_ERROR_MESSAGE =
  "Unable to connect to the server. Please try again later.";

/* ─── Rate-limit windows (ms) & caps ─────────────────────── */

/** 15-minute window for most auth endpoints. */
export const RL_WINDOW_MS = 15 * 60 * 1000;

/** Max registration attempts per IP per window. */
export const RL_REGISTER = 5;

/** Max forgot-password requests per IP per window. */
export const RL_FORGOT_PW = 5;

/** Max reset-password attempts per IP per window. */
export const RL_RESET_PW = 8;

/** Max change-password attempts per session per window. */
export const RL_CHANGE_PW = 5;

/** Max profile-update attempts per session per window. */
export const RL_PROFILE_UPDATE = 15;

/** Max avatar upload attempts per session per window. */
export const RL_AVATAR_UPLOAD = 10;

/** Max delete-account attempts per session per window. */
export const RL_DELETE_ACCOUNT = 3;

/** Max estimate submissions per session per window. */
export const RL_ESTIMATE = 12;

/** Max verify-email hits per IP per window. */
export const RL_VERIFY_EMAIL = 10;

/* ─── Token lifetimes ────────────────────────────────────── */

/** Email-verification token lifetime (24 h). */
export const VERIFY_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

/** Password-reset token lifetime (1 h). */
export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

/** How often the JWT callback re-checks tokenVersion (60 s). */
export const TOKEN_VERSION_CHECK_INTERVAL_MS = 60 * 1000;
