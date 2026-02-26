import { NextResponse } from "next/server";
import { auth } from "@/config/auth";
import { db } from "@/config/db";
import { updateProfileSchema } from "@/lib/validations/auth";
import { ensureTrustedOrigin } from "@/lib/security";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { RL_PROFILE_UPDATE, RL_WINDOW_MS } from "@/lib/constants";

export async function PATCH(req: Request) {
  try {
    const originError = ensureTrustedOrigin(req);
    if (originError) return originError;

    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ip = getClientIp(req);
    const rl = checkRateLimit(`profile:${session.user.id}:${ip}`, RL_PROFILE_UPDATE, RL_WINDOW_MS);
    if (!rl.ok) return rateLimitResponse(rl);

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
