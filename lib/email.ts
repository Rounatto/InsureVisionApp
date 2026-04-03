import nodemailer from "nodemailer";

/**
 * Lazy-initialized Nodemailer transporter(s) using Gmail SMTP.
 *
 * Required env vars:
 *   GMAIL_USER     — one or multiple comma-separated Gmail addresses
 *   GMAIL_APP_PASS — one app password, or comma-separated app passwords
 */
type GmailAccount = {
  user: string;
  pass: string;
};

let _accounts: GmailAccount[] | null = null;
let _transporters: nodemailer.Transporter[] | null = null;
let _sendCursor = 0;

function splitCsv(value?: string) {
  return (value ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function normalizeAppPassword(value: string) {
  // Gmail app passwords are often copied with spaces every 4 chars.
  return value.replace(/\s+/g, "");
}

function getAccounts() {
  if (_accounts) return _accounts;

  const users = splitCsv(process.env.GMAIL_USER);
  const passes = splitCsv(process.env.GMAIL_APP_PASS).map(normalizeAppPassword);

  if (!users.length || !passes.length) {
    throw new Error("GMAIL_USER and GMAIL_APP_PASS env vars are required");
  }

  if (passes.length !== users.length) {
    throw new Error("GMAIL_USER and GMAIL_APP_PASS must have matching counts (one app password per Gmail account)");
  }

  _accounts = users.map((user, index) => ({ user, pass: passes[index] }));
  return _accounts;
}

function getTransporters() {
  if (!_transporters) {
    _transporters = getAccounts().map(({ user, pass }) =>
      nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
      }),
    );
  }
  return _transporters;
}

type BaseMailOptions = Omit<nodemailer.SendMailOptions, "from">;

async function sendWithFallback(options: BaseMailOptions) {
  const accounts = getAccounts();
  const transporters = getTransporters();

  let lastError: unknown = null;

  for (let attempt = 0; attempt < transporters.length; attempt += 1) {
    const index = (_sendCursor + attempt) % transporters.length;
    const transporter = transporters[index];
    const account = accounts[index];

    try {
      await transporter.sendMail({
        from: `"InsureVision" <${account.user}>`,
        ...options,
      });
      _sendCursor = (index + 1) % transporters.length;
      return;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Failed to send email with configured Gmail accounts");
}

/* ─── Base URL helper ─────────────────────────────────────── */
function getBaseUrl(): string {
  return process.env.AUTH_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
}

/* ─── Email Verification ─────────────────────────────────── */
export async function sendVerificationEmail(email: string, token: string) {
  const url = `${getBaseUrl()}/api/auth/verify-email?token=${token}`;

  await sendWithFallback({
    to: email,
    subject: "Verify your email - InsureVision",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#fff;border-radius:12px;border:1px solid #e5e7eb">
        <h2 style="margin:0 0 8px;color:#111">Verify your email</h2>
        <p style="color:#6b7280;font-size:14px;line-height:1.6">
          Thanks for signing up for InsureVision. Click the button below to verify your email address.
        </p>
        <a href="${url}" style="display:inline-block;margin:24px 0;padding:12px 32px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px">
          Verify Email
        </a>
        <p style="color:#9ca3af;font-size:12px">
          This link expires in 24 hours.
        </p>
      </div>
    `,
  });
}

/* ─── Password Reset ─────────────────────────────────────── */
export async function sendPasswordResetEmail(email: string, token: string) {
  const url = `${getBaseUrl()}/reset-password?token=${token}`;

  await sendWithFallback({
    to: email,
    subject: "Reset your password — InsureVision",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#fff;border-radius:12px;border:1px solid #e5e7eb">
        <h2 style="margin:0 0 8px;color:#111">Reset your password</h2>
        <p style="color:#6b7280;font-size:14px;line-height:1.6">
          We received a request to reset your password. Click the button below to choose a new one.
        </p>
        <a href="${url}" style="display:inline-block;margin:24px 0;padding:12px 32px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px">
          Reset Password
        </a>
        <p style="color:#9ca3af;font-size:12px">
          This link expires in 1 hour. If you didn't request a reset, you can ignore this email.
        </p>
      </div>
    `,
  });
}
