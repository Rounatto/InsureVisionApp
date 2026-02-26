interface SendPasswordResetEmailParams {
  to: string;
  resetUrl: string;
}

const RESEND_API_URL = "https://api.resend.com/emails";

function getBaseUrl() {
  return (
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000"
  );
}

export async function sendPasswordResetEmail({
  to,
  resetUrl,
}: SendPasswordResetEmailParams) {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM;

  if (!apiKey) {
    throw new Error("Missing RESEND_API_KEY");
  }

  if (!fromEmail) {
    throw new Error("Missing EMAIL_FROM");
  }

  const appBaseUrl = getBaseUrl();

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
      <h2 style="margin-bottom: 8px;">Reset your password</h2>
      <p style="margin-top: 0;">We received a request to reset your InsureVision password.</p>
      <p>
        <a href="${resetUrl}" style="display: inline-block; background: #111827; color: #ffffff; text-decoration: none; padding: 10px 16px; border-radius: 9999px; font-weight: 600;">
          Reset Password
        </a>
      </p>
      <p>This link expires in 30 minutes.</p>
      <p>If you did not request this, you can ignore this email.</p>
      <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
      <p style="font-size: 12px; color: #6b7280;">
        InsureVision<br/>
        <a href="${appBaseUrl}" style="color: #6b7280;">${appBaseUrl}</a>
      </p>
    </div>
  `;

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to,
      subject: "Reset your InsureVision password",
      html,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Resend error: ${response.status} ${errorBody}`);
  }
}
