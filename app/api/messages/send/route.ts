import { NextResponse } from "next/server";
import { z } from "zod";
import { requireDb, requireAuth, requireTrustedOrigin, validateBody, requireRateLimit, db } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";
import { RL_BANNED_USER_MESSAGE } from "@/lib/constants";
import { getClientIp } from "@/lib/rate-limit";
import type { ErrorResponse } from "@/types/auth";

const SendMessageSchema = z.object({
  content: z.string().min(1, "Message cannot be empty").max(5000, "Message too long"),
});

type SendMessageInput = z.infer<typeof SendMessageSchema>;

export async function POST(req: Request): Promise<NextResponse> {
  // 1. CSRF Protection
  const originError = requireTrustedOrigin(req);
  if (originError) return originError;

  // 2. Database Check
  const dbError = requireDb();
  if (dbError) return dbError;

  // 3. Authentication
  const { session, error: authError } = await requireAuth();
  if (authError) return authError;

  // 4. User must be banned to send message
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { banned: true, email: true },
  });

  if (!user) {
    return NextResponse.json<ErrorResponse>(
      { success: false, message: "User not found" },
      { status: 404 }
    );
  }

  if (!user.banned) {
    return NextResponse.json<ErrorResponse>(
      { success: false, message: "Only banned users can send messages to admins" },
      { status: 403 }
    );
  }

  // 5. Rate Limiting
  const rlError = requireRateLimit(req, `message:${session.user.id}`, RL_BANNED_USER_MESSAGE);
  if (rlError) return rlError;

  // 6. Validation
  const body = await req.json();
  const { data, error } = validateBody(SendMessageSchema, body);
  if (error) return error;

  try {
    // 7. Find or create conversation
    let conversation = await db.conversation.findUnique({
      where: { bannedUserId: session.user.id },
    });

    if (!conversation) {
      conversation = await db.conversation.create({
        data: {
          bannedUserId: session.user.id,
        },
      });
    }

    // 8. Create message
    const message = await db.message.create({
      data: {
        conversationId: conversation.id,
        senderId: session.user.id,
        senderEmail: user.email!,
        senderType: "USER",
        content: data.content,
      },
    });

    // 9. Log audit
    await logAudit({
      userId: session.user.id,
      action: "BANNED_USER_MESSAGE_SENT",
      ip: getClientIp(req),
      metadata: { conversationId: conversation.id, messageId: message.id },
    });

    // 10. Broadcast via WebSocket (TODO: implement WebSocket broadcast)
    // broadcast({ type: "message:new", data: { conversationId: conversation.id, message } });

    return NextResponse.json(
      { success: true, message },
      { status: 201 }
    );
  } catch (err) {
    console.error("[MESSAGE_SEND_ERROR]", err);
    return NextResponse.json<ErrorResponse>(
      { success: false, message: "Failed to send message" },
      { status: 500 }
    );
  }
}
