import { NextResponse } from "next/server";
import { auth } from "@/config/auth";
import { db } from "@/config/db";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { password: true },
    });

    return NextResponse.json({
      canChangePassword: Boolean(user?.password),
    });
  } catch (error) {
    console.error("Account capabilities error:", error);
    return NextResponse.json(
      { error: "Failed to load account capabilities." },
      { status: 500 },
    );
  }
}
