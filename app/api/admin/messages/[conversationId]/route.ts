import { NextResponse } from "next/server";
import { requireDb, requireAdmin, db } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";
import { getClientIp } from "@/lib/rate-limit";
import type { ErrorResponse } from "@/types/auth";

const PAGE_SIZE = 50;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ conversationId: string }> }
): Promise<NextResponse> {
  const { conversationId } = await params;

  // 1. Database Check
  const dbError = requireDb();
  if (dbError) return dbError;

  // 2. Admin Check
  const { session, error: adminError } = await requireAdmin();
  if (adminError) return adminError;

  try {
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const skip = Math.max(0, (page - 1) * PAGE_SIZE);

    // Get conversation with messages
    const conversation = await db.conversation.findUnique({
      where: { id: conversationId },
      include: {
        user: {
          select: { id: true, email: true, name: true, banned: true, createdAt: true },
        },
        messages: {
          take: PAGE_SIZE,
          skip,
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json<ErrorResponse>(
        { success: false, message: "Conversation not found" },
        { status: 404 }
      );
    }

    // Log admin access
    await logAudit({
      userId: session.user.id,
      action: "ADMIN_ACCESS",
      ip: getClientIp(req),
      metadata: {
        page: "message_thread",
        conversationId: conversationId,
        bannedUserId: conversation.bannedUserId,
      },
    });

    const total = await db.message.count({
      where: { conversationId: conversationId },
    });

    return NextResponse.json(
      {
        success: true,
        conversation,
        pagination: {
          page,
          pageSize: PAGE_SIZE,
          total,
          totalPages: Math.ceil(total / PAGE_SIZE),
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[GET_CONVERSATION_THREAD_ERROR]", err);
    return NextResponse.json<ErrorResponse>(
      { success: false, message: "Failed to fetch conversation thread" },
      { status: 500 }
    );
  }
}
