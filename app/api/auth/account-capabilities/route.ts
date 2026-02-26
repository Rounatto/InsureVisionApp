import { NextResponse } from "next/server";
import { auth } from "@/config/auth";
import { db } from "@/config/db";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await Promise.race([
      db.user.findUnique({
        where: { id: session.user.id },
        select: { password: true },
      }),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 2500)),
    ]);

    return NextResponse.json({
      canChangePassword: Boolean(user?.password),
    });
  } catch (error) {
    console.error("Account capabilities error:", error);
    // Fail-safe: do not break profile page if DB is temporarily unavailable.
    return NextResponse.json({ canChangePassword: false });
  }
}
