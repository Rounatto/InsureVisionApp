import { NextResponse } from "next/server";
import { requireDb, requireAdmin, db } from "@/lib/api-helpers";
import { getClientIp } from "@/lib/rate-limit";
import type { ErrorResponse } from "@/types/auth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const { conversationId } = await params;

  // 1. Database Check
  const dbError = requireDb();
  if (dbError) return dbError;

  // 2. Admin Check
  const { session, error: adminError } = await requireAdmin();
  if (adminError) return adminError;

  try {
    // Get all unread messages in this conversation for this admin
    const messages = await db.message.findMany({
      where: { conversationId },
      select: { id: true },
    });

    // Mark all messages as read by this admin
    const adminEmail = session.user.email;

    for (const message of messages) {
      await db.adminMessageRead.upsert({
        where: {
          messageId_adminEmail: {
            messageId: message.id,
            adminEmail,
          },
        },
        update: {
          readAt: new Date(),
        },
        create: {
          messageId: message.id,
          adminEmail,
        },
      });
    }

    return NextResponse.json(
      { success: true, message: "Messages marked as read" },
      { status: 200 }
    );
  } catch (err) {
    console.error("[MARK_READ_ERROR]", err);
    return NextResponse.json<ErrorResponse>(
      { success: false, message: "Failed to mark messages as read" },
      { status: 500 }
    );
  }
}
