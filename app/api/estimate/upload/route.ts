import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { getSupabaseAdmin, hasSupabaseAdminEnv } from '@/config/supabase';
import {
  db,
  requireAuth,
  requireDb,
  requireRateLimit,
  requireTrustedOrigin,
} from '@/lib/server/api-helpers';
import { RL_ESTIMATE } from '@/lib/constants';
import type { ErrorResponse } from '@/types/auth';

const BUCKET = 'damage-photos';
const ALLOWED_TYPES = ['image/png', 'image/jpeg'];
const MAX_SIZE = 4 * 1024 * 1024; // 4 MB

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const originError = requireTrustedOrigin(req);
    if (originError) return originError;

    const dbError = requireDb();
    if (dbError) return dbError;

    const { session, error: authError } = await requireAuth();
    if (authError) return authError;

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { banned: true },
    });

    if (user?.banned) {
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          message: 'Your account is banned and cannot perform this action.',
        },
        { status: 403 }
      );
    }

    const rlError = requireRateLimit(
      req,
      `estimate-upload:${session.user.id}`,
      RL_ESTIMATE
    );
    if (rlError) return rlError;

    if (!hasSupabaseAdminEnv()) {
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          message:
            'Photo storage is not configured on the server. Please contact support.',
        },
        { status: 503 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('photo');
    const batchId = String(formData.get('batchId') ?? '').trim();

    if (!(file instanceof File)) {
      return NextResponse.json<ErrorResponse>(
        { success: false, message: 'A single photo file is required.' },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          message: `Invalid file type: ${file.name}. Only PNG and JPG are accepted.`,
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          message: `File too large: ${file.name}. Maximum size is 4MB.`,
        },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `${crypto.randomUUID()}.${ext}`;
    const safeBatchId = /^[a-zA-Z0-9_-]{6,64}$/.test(batchId)
      ? batchId
      : crypto.randomUUID();
    const storagePath = `${session.user.id}/${safeBatchId}/${fileName}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          message: `Upload failed for ${file.name}. Please try again.`,
        },
        { status: 502 }
      );
    }

    const { data: urlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(storagePath);

    return NextResponse.json({
      success: true,
      fileName: file.name,
      url: urlData.publicUrl,
    });
  } catch (error) {
    console.error('Estimate upload error:', error);
    return NextResponse.json<ErrorResponse>(
      {
        success: false,
        message: 'Failed to upload photo. Please try again.',
      },
      { status: 500 }
    );
  }
}

