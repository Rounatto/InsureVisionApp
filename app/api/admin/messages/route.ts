import { NextResponse } from "next/server";
import { z } from "zod";
import { requireDb, requireAdmin, requireTrustedOrigin, validateBody, requireRateLimit, db } from "@/lib/server/api-helpers";
import { logAudit } from "@/lib/server/audit";
import { getAllAdminEmails } from "@/lib/admin";
import { RL_ADMIN_MESSAGE } from "@/lib/constants";
import { getClientIp } from "@/lib/rate-limit";
import type { ErrorResponse } from "@/types/auth";

const PAGE_SIZE = 50;

// GET - List all conversations with banned users
export async function GET(req: Request): Promise<NextResponse> {
  // 1. Database Check
  const dbError = requireDb();
  if (dbError) return dbError;

  // 2. Admin Check
  const { session, error: adminError } = await requireAdmin();
  if (adminError) return adminError;

  // 3. Log admin access
  await logAudit({
    userId: session.user.id,
    action: "ADMIN_ACCESS",
    ip: getClientIp(req),
    metadata: { page: "messages" },
  });

  try {
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const skip = Math.max(0, (page - 1) * PAGE_SIZE);

    // Get all conversations with latest message
    const conversations = await db.conversation.findMany({
      skip,
      take: PAGE_SIZE,
      include: {
        user: {
          select: { id: true, email: true, name: true, banned: true },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const total = await db.conversation.count();

    // Get unread counts for this admin (simplified - count all messages)
    // Once AdminMessageRead table is created and migration runs, this will query actual read status
    const conversationsWithUnread = conversations.map((conv) => {
      // Show indicator if conversation has messages
      const hasMessages = conv.messages.length > 0;

      return {
        id: conv.id,
        user: conv.user,
        lastMessage: conv.messages[0] || null,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
        unreadCount: hasMessages ? 1 : 0,
      };
    });

    return NextResponse.json(
      {
        success: true,
        conversations: conversationsWithUnread,
        totalAdmins: getAllAdminEmails().length,
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
    console.error("[GET_ADMIN_CONVERSATIONS_ERROR]", err);
    return NextResponse.json<ErrorResponse>(
      { success: false, message: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}

// POST - Admin sends a reply
const ReplySchema = z.object({
  conversationId: z.string().cuid("Invalid conversation ID"),
  content: z.string().min(1, "Message cannot be empty").max(5000, "Message too long"),
});

type ReplyInput = z.infer<typeof ReplySchema>;

export async function POST(req: Request): Promise<NextResponse> {
  // 1. CSRF Protection
  const originError = requireTrustedOrigin(req);
  if (originError) return originError;

  // 2. Database Check
  const dbError = requireDb();
  if (dbError) return dbError;

  // 3. Admin Check
  const { session, error: adminError } = await requireAdmin();
  if (adminError) return adminError;

  // 4. Rate Limiting
  const rlError = requireRateLimit(req, `admin-message:${session.user.id}`, RL_ADMIN_MESSAGE);
  if (rlError) return rlError;

  // 5. Validation
  const body = await req.json();
  const { data, error } = validateBody(ReplySchema, body);
  if (error) return error;

  try {
    // 6. Verify conversation exists
    const conversation = await db.conversation.findUnique({
      where: { id: data.conversationId },
    });

    if (!conversation) {
      return NextResponse.json<ErrorResponse>(
        { success: false, message: "Conversation not found" },
        { status: 404 }
      );
    }

    // 7. Create message
    const message = await db.message.create({
      data: {
        conversationId: data.conversationId,
        senderId: session.user.id,
        senderEmail: session.user.email,
        senderType: "ADMIN",
        content: data.content,
      },
    });

    // 8. Update conversation updatedAt
    await db.conversation.update({
      where: { id: data.conversationId },
      data: { updatedAt: new Date() },
    });

    // 9. Log audit
    await logAudit({
      userId: session.user.id,
      action: "ADMIN_MESSAGE_SENT",
      ip: getClientIp(req),
      metadata: { conversationId: data.conversationId, messageId: message.id },
    });

    // 10. Broadcast via WebSocket (TODO: implement)
    // broadcast({ type: "message:new", data: { conversationId: data.conversationId, message } });

    return NextResponse.json(
      { success: true, message },
      { status: 201 }
    );
  } catch (err) {
    console.error("[ADMIN_REPLY_ERROR]", err);
    return NextResponse.json<ErrorResponse>(
      { success: false, message: "Failed to send reply" },
      { status: 500 }
    );
  }
}

