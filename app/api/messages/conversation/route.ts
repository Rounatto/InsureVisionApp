import { NextResponse } from "next/server";
import { requireDb, requireAuth, db } from "@/lib/api-helpers";
import type { ErrorResponse } from "@/types/auth";

const PAGE_SIZE = 50;

export async function GET(req: Request): Promise<NextResponse> {
  // 1. Database Check
  const dbError = requireDb();
  if (dbError) return dbError;

  // 2. Authentication
  const { session, error: authError } = await requireAuth();
  if (authError) return authError;

  // 3. User must be banned
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { banned: true },
  });

  if (!user?.banned) {
    return NextResponse.json<ErrorResponse>(
      { success: false, message: "Only banned users can access messages" },
      { status: 403 }
    );
  }

  try {
    // 4. Get conversation with pagination
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const skip = Math.max(0, (page - 1) * PAGE_SIZE);

    const conversation = await db.conversation.findUnique({
      where: { bannedUserId: session.user.id },
      include: {
        messages: {
          take: PAGE_SIZE,
          skip,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!conversation) {
      // User has no conversation yet
      return NextResponse.json(
        { success: true, conversation: null, messages: [] },
        { status: 200 }
      );
    }

    // Reverse messages to show oldest to newest
    const messages = conversation.messages.reverse();

    return NextResponse.json(
      { success: true, conversation, messages },
      { status: 200 }
    );
  } catch (err) {
    console.error("[GET_CONVERSATION_ERROR]", err);
    return NextResponse.json<ErrorResponse>(
      { success: false, message: "Failed to fetch conversation" },
      { status: 500 }
    );
  }
}
