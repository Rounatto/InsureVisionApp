import { NextResponse } from "next/server";
import { db } from "@/config/db";

/**
 * GET /api/auth/verify-email?token=...
 *
 * Verifies a user's email address using the token sent during registration.
 * On success, redirects to /login with a success message.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.redirect(
        new URL("/login?error=missing-token", req.url)
      );
    }

    // 1. Find token
    const verificationToken = await db.verificationToken.findFirst({
      where: { token },
    });

    if (!verificationToken) {
      return NextResponse.redirect(
        new URL("/login?error=invalid-token", req.url)
      );
    }

    // 2. Check expiry
    if (new Date() > verificationToken.expires) {
      await db.verificationToken.delete({
        where: {
          identifier_token: {
            identifier: verificationToken.identifier,
            token: verificationToken.token,
          },
        },
      });
      return NextResponse.redirect(
        new URL("/login?error=expired-token", req.url)
      );
    }

    // 3. Find user by email
    const user = await db.user.findUnique({
      where: { email: verificationToken.identifier },
    });

    if (!user) {
      return NextResponse.redirect(
        new URL("/login?error=user-not-found", req.url)
      );
    }

    // 4. Mark email as verified
    await db.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    });

    // 5. Delete the used token
    await db.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: verificationToken.identifier,
          token: verificationToken.token,
        },
      },
    });

    // 6. Redirect to login with success
    return NextResponse.redirect(
      new URL("/login?verified=true", req.url)
    );
  } catch (error) {
    console.error("Verify email error:", error);
    return NextResponse.redirect(
      new URL("/login?error=server-error", req.url)
    );
  }
}
