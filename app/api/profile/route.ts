import { NextResponse } from "next/server";
import { requireDb, requireAuth, validateBody, db } from "@/lib/server/api-helpers";
import { updateProfileSchema } from "@/lib/validations/auth";
import type { ErrorResponse } from "@/types/auth";

export async function PATCH(req: Request) {
  try {
    const dbError = requireDb();
    if (dbError) return dbError;

    const { session, error: authError } = await requireAuth();
    if (authError) return authError;

    // Check if user is banned
    const bannedCheck = await db.user.findUnique({
      where: { id: session.user.id },
      select: { banned: true },
    });

    if (bannedCheck?.banned) {
      return NextResponse.json<ErrorResponse>(
        { success: false, message: "Your account is banned and cannot perform this action." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { data: validated, error: valError } = validateBody(updateProfileSchema, body);
    if (valError) return valError;

    const { name } = validated;

    const updatedUser = await db.user.update({
      where: { id: session.user.id },
      data: { name },
      select: { id: true, name: true, email: true },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json<ErrorResponse>(
      { success: false, message: "Failed to update profile. Please try again." },
      { status: 500 }
    );
  }
}
