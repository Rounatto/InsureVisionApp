# InsureVision Backend Runbook

Last updated: 2026-02-25

## 1) Architecture

Request flow:

1. `middleware.ts` + `config/auth.config.ts` decides route access.
2. Route handler in `app/api/**/route.ts` parses request.
3. Zod schemas in `lib/validations/auth.ts` validate payloads.
4. Session checks via `auth()` from `config/auth.ts`.
5. Data read/write via Prisma `db` from `config/db.ts`.
6. Integrations: Supabase Storage (`config/supabase.ts`) and Gmail SMTP (`lib/email.ts`).
7. Response via `NextResponse.json(...)` or redirect.

---

## 2) Endpoint matrix

### Auth

| Method | Path | Auth | Purpose | Input | Success | Common errors |
|---|---|---|---|---|---|---|
| POST | `/api/auth/register` | No | Create account + send verification email | JSON `{ name, email, password, confirmPassword }` | `201` with `{ success, message, user }` | `400` validation, `409` email exists, `500` server |
| GET | `/api/auth/verify-email?token=...` | No | Verify email from token | Query `token` | Redirect to `/login?verified=true` | Redirect with `missing-token`, `invalid-token`, `expired-token`, `server-error` |
| POST | `/api/auth/forgot-password` | No | Issue reset token + send email | JSON `{ email }` | `200` generic success message | `400` invalid email, `500` server |
| POST | `/api/auth/reset-password` | No | Reset password using token | JSON `{ token, password, confirmPassword }` | `200` message | `400` invalid/expired token, user not found |
| PATCH | `/api/auth/change-password` | Yes | Change password for logged-in user | JSON `{ currentPassword, newPassword, confirmPassword }` | `200` `{ success: true }` | `401` unauthorized, `400` invalid/current wrong/google-only account |
| DELETE | `/api/auth/delete-account` | Yes | Delete current user account | None | `200` `{ success: true }` | `401` unauthorized, `500` server |
| GET | `/api/auth/stats` | Yes | Get user activity stats | None | `200` `{ estimates, photos }` | `401` unauthorized, `500` server |

### Profile

| Method | Path | Auth | Purpose | Input | Success | Common errors |
|---|---|---|---|---|---|---|
| PATCH | `/api/profile` | Yes | Update profile name | JSON `{ name }` | `200` `{ user }` | `401` unauthorized, `400` validation, `500` server |

### Estimation

| Method | Path | Auth | Purpose | Input | Success | Common errors |
|---|---|---|---|---|---|---|
| POST | `/api/estimate` | Yes | Upload photos + create estimate | `multipart/form-data` with `photos[]` (PNG/JPG, max 8 files, each <=10MB) | `200` estimate object with `id`, `totalCost`, `parts`, `photos`, `summary` | `401` unauthorized, `400` file validation, `500` upload/server |
| GET | `/api/estimates` | Yes | List user estimates | None | `200` array of estimates incl. parts | `401` unauthorized, `500` server |

### NextAuth handler

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET/POST | `/api/auth/[...nextauth]` | N/A | NextAuth core routes (signin, callback, session, etc.) |

---

## 3) File-by-file function inventory

## `middleware.ts`
- `default export middleware`: NextAuth middleware instance used by Next.js.
- `config.matcher`: Route matcher to run middleware on app/API routes except static assets.

## `config/auth.config.ts`
- `authorized({ auth, request })`: Central route-access logic used by middleware.
  - Allows public pages and `/api/auth/**`.
  - Redirects logged-in users away from landing/auth pages to `/dashboard`.
  - Blocks private routes when not authenticated.

## `config/auth.ts`
- `handlers`: NextAuth route handlers re-exported by `[...nextauth]/route.ts`.
- `auth`: Server helper to read session in route handlers.
- `Credentials.authorize(credentials)`: Email/password login flow:
  - Validates via `loginSchema`.
  - Loads user by email.
  - Rejects missing user/password or unverified email.
  - Verifies bcrypt hash and returns session-safe user object.
- `callbacks.session({ session, token })`: Adds `token.sub` to `session.user.id`.
- `callbacks.jwt({ token })`: Pass-through token callback.

## `config/db.ts`
- `createPrismaClient()`: Builds Prisma client with Postgres adapter (`@prisma/adapter-pg`).
- `db`: Singleton Prisma client reused across hot reloads in dev.

## `config/supabase.ts`
- `getSupabaseAdmin()`: Lazy singleton Supabase service-role client for server-only storage operations.

## `lib/validations/auth.ts`
- `registerSchema`: Validates register payload + password confirmation.
- `loginSchema`: Validates login payload.
- `forgotPasswordSchema`: Validates email payload.
- `resetPasswordSchema`: Validates token/password/reset confirmation.
- `updateProfileSchema`: Validates profile name updates.
- `changePasswordSchema`: Validates current/new password + confirmation.

## `lib/email.ts`
- `getTransporter()`: Lazy Gmail Nodemailer transporter.
- `getBaseUrl()`: Resolves app base URL from env vars.
- `sendVerificationEmail(email, token)`: Sends verification link email.
- `sendPasswordResetEmail(email, token)`: Sends password reset link email.

## `lib/constants.ts`
- `SALT_ROUNDS`: bcrypt hashing cost factor.
- `NETWORK_ERROR_MESSAGE`: Generic client-safe network error message.

## `app/api/auth/register/route.ts`
- `POST(req)`: Register endpoint.

## `app/api/auth/verify-email/route.ts`
- `GET(req)`: Email verification endpoint.

## `app/api/auth/forgot-password/route.ts`
- `POST(req)`: Forgot-password endpoint.

## `app/api/auth/reset-password/route.ts`
- `POST(req)`: Password reset endpoint.

## `app/api/auth/change-password/route.ts`
- `PATCH(req)`: Password change endpoint.

## `app/api/auth/delete-account/route.ts`
- `DELETE()`: Account deletion endpoint.

## `app/api/auth/stats/route.ts`
- `GET()`: User stats endpoint.

## `app/api/profile/route.ts`
- `PATCH(req)`: Profile update endpoint.

## `app/api/estimate/route.ts`
- `POST(req)`: Photo upload + estimate creation endpoint.
  - Note: current implementation generates mock parts/cost locally.
  - `AI_MODEL_CALL` comment marks where real model integration should replace mock logic.

## `app/api/estimates/route.ts`
- `GET()`: Estimate listing endpoint.

## `app/api/auth/[...nextauth]/route.ts`
- Re-exports `GET` and `POST` handlers from NextAuth.

## `lib/generatePdf.ts` (currently frontend-side utility)
- `downloadEstimatePdf(data)`: Creates and downloads PDF report via `jsPDF`.

---

## 4) Data model ownership map (Prisma)

From `prisma/schema.prisma`:

- `User`: identity + optional password (`null` for OAuth-only) + relations.
- `Account`: OAuth account links (NextAuth).
- `Session`: session tokens (NextAuth).
- `VerificationToken`: email verification + reset token storage.
- `Estimate`: top-level estimate (`summary`, `totalCost`, `photos[]`).
- `EstimatePart`: line items per estimate (`name`, `cost`, `severity`).

Cascade delete is configured from `User` to child records through relations.

---

## 5) Required environment variables

### Auth / app
- `AUTH_URL` or `NEXTAUTH_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

### Database
- `DATABASE_URL`

### Email (Gmail SMTP)
- `GMAIL_USER`
- `GMAIL_APP_PASS`

### Supabase Storage
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

---

## 6) Operational notes for backend owner

- Registration creates user first, then attempts to send verification email (email failure does not roll back user creation).
- Password reset and email verification share `VerificationToken` table.
- `/api/auth/forgot-password` is intentionally enumeration-safe.
- `/api/estimate` currently stores real uploaded photos but mock AI estimate data.
- `SUPABASE_SERVICE_ROLE_KEY` must remain server-only.

---

## 7) AI integration handoff (ready mode)

`/api/estimate` now calls a provider boundary in `lib/estimate/provider.ts`.

- `AI_PROVIDER=mock` (default): existing mock behavior.
- `AI_PROVIDER=http`: calls external AI endpoint and falls back to mock if the call fails.

### Env vars for HTTP mode

- `AI_PROVIDER=http`
- `AI_ENDPOINT=https://...` (AI team's inference endpoint)
- `AI_API_KEY=...` (optional bearer token)
- `AI_TIMEOUT_MS=15000` (optional, defaults to 15000)

### Contract the AI team should implement

- Endpoint: `POST` JSON
- Request body:
  - `estimateId: string`
  - `userId: string`
  - `photoUrls: string[]`
  - `photoCount: number`
- Response body:
  - `parts: { name: string; cost: number; severity: string }[]`
  - `summary: string`

### What the AI team should do

1. Expose the above endpoint and auth scheme.
2. Ensure response matches the exact JSON contract.
3. Return at least one part with numeric `cost`.
4. Share endpoint URL, key format, and expected timeout.

### What you should do to link their work

1. Set the env vars in your runtime (`AI_PROVIDER=http`, `AI_ENDPOINT`, optional `AI_API_KEY`).
2. Keep `/api/estimate` unchanged; it already routes through the provider.
3. Test with one real estimate submission.
4. If provider fails, app still returns a mock estimate (safe fallback) while logs show provider errors.

