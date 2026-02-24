import { NextResponse } from "next/server";
import { auth } from "@/config/auth";
import { db } from "@/config/db";
import { updateProfileSchema } from "@/lib/validations/auth";

export async function PATCH(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = updateProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name } = parsed.data;

    const updatedUser = await db.user.update({
      where: { id: session.user.id },
      data: { name },
      select: { id: true, name: true, email: true },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: "Failed to update profile. Please try again." },
      { status: 500 }
    );
  }
}
