import nodemailer from "nodemailer";

/**
 * Lazy-initialized Nodemailer transporter using Gmail SMTP.
 *
 * Required env vars:
 *   GMAIL_USER     — your Gmail address (e.g. yourapp@gmail.com)
 *   GMAIL_APP_PASS — a 16-char App Password generated from Google Account settings
 */
let _transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!_transporter) {
    const user = process.env.GMAIL_USER;
    const pass = process.env.GMAIL_APP_PASS;
    if (!user || !pass) {
      throw new Error("GMAIL_USER and GMAIL_APP_PASS env vars are required");
    }
    _transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });
  }
  return _transporter;
}

/* ─── Base URL helper ─────────────────────────────────────── */
function getBaseUrl(): string {
  return process.env.AUTH_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
}

/* ─── Email Verification ─────────────────────────────────── */
export async function sendVerificationEmail(email: string, token: string) {
  const url = `${getBaseUrl()}/api/auth/verify-email?token=${token}`;

  await getTransporter().sendMail({
    from: `"InsureVision" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: "Verify your email — InsureVision",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#fff;border-radius:12px;border:1px solid #e5e7eb">
        <h2 style="margin:0 0 8px;color:#111">Verify your email</h2>
        <p style="color:#6b7280;font-size:14px;line-height:1.6">
          Thanks for signing up for InsureVision! Click the button below to verify your email address.
        </p>
        <a href="${url}" style="display:inline-block;margin:24px 0;padding:12px 32px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px">
          Verify Email
        </a>
        <p style="color:#9ca3af;font-size:12px">
          This link expires in 24 hours. If you didn't create an account, you can ignore this email.
        </p>
      </div>
    `,
  });
}

/* ─── Password Reset ─────────────────────────────────────── */
export async function sendPasswordResetEmail(email: string, token: string) {
  const url = `${getBaseUrl()}/reset-password?token=${token}`;

  await getTransporter().sendMail({
    from: `"InsureVision" <${process.env.GMAIL_USER}>`,
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
