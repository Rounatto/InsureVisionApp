import { NextResponse } from 'next/server';
import {
  db,
  requireAuth,
  requireDb,
  requireRateLimit,
  requireTrustedOrigin,
} from '@/lib/server/api-helpers';
import {
  queueEstimateJob,
  dispatchEstimateJob,
} from '@/lib/server/estimate/jobs';
import { RL_ESTIMATE } from '@/lib/constants';
import type { ErrorResponse } from '@/types/auth';
import crypto from 'crypto';

export const runtime = 'nodejs';
export const maxDuration = 10;
const LEGACY_MAX_SIZE_BYTES = 10 * 1024 * 1024;
const LEGACY_ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

async function handleLegacyMultipartEstimate(req: Request, userId: string) {
  const formData = await req.formData();
  const files = formData
    .getAll('photos')
    .filter((item): item is File => item instanceof File);

  if (!files.length) {
    return NextResponse.json<ErrorResponse>(
      { success: false, message: 'At least one photo is required.' },
      { status: 400 }
    );
  }

  if (files.length > 8) {
    return NextResponse.json<ErrorResponse>(
      { success: false, message: 'Maximum 8 photos allowed.' },
      { status: 400 }
    );
  }

  for (const file of files) {
    if (!LEGACY_ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          message: `Invalid file type: ${file.name}. Only PNG, JPG, or WEBP are accepted.`,
        },
        { status: 400 }
      );
    }
    if (file.size > LEGACY_MAX_SIZE_BYTES) {
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          message: `File too large: ${file.name}. Maximum size is 10MB.`,
        },
        { status: 400 }
      );
    }
  }

  const parts = [
    { name: 'Front Bumper', cost: 600, severity: 'Medium' },
    { name: 'Hood', cost: 900, severity: 'High' },
    { name: 'Left Headlight', cost: 350, severity: 'Low' },
  ];
  const totalCost = parts.reduce((sum, p) => sum + p.cost, 0);
  const estimateId = `EST-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

  if (typeof db?.estimate?.create === 'function') {
    await db.estimate.create({
      data: {
        id: estimateId,
        userId,
        totalCost,
        summary: 'Legacy multipart estimate compatibility response.',
        photos: files.map((f) => f.name),
      },
    });
  }

  return NextResponse.json({
    id: estimateId,
    totalCost,
    parts,
    summary: 'Legacy multipart estimate compatibility response.',
  });
}

/**
 * POST /api/estimate
 *
 * Creates an async estimate job and returns immediately with a job ID.
 * Client should poll /api/estimate/status/[jobId] until completion.
 */
export async function POST(req: Request) {
  try {
    const originError = requireTrustedOrigin(req);
    if (originError) return originError;

    const dbError = requireDb();
    if (dbError) return dbError;

    const { session, error: authError } = await requireAuth();
    if (authError) return authError;

    const user =
      typeof db?.user?.findUnique === 'function'
        ? await db.user.findUnique({
            where: { id: session.user.id },
            select: { banned: true },
          })
        : null;

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
      `estimate:${session.user.id}`,
      RL_ESTIMATE
    );
    if (rlError) return rlError;

    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      return handleLegacyMultipartEstimate(req, session.user.id);
    }

    const body = (await req.json()) as {
      photoUrls?: string[];
      photoCount?: number;
    };

    const photoUrls = Array.isArray(body.photoUrls)
      ? body.photoUrls.filter(
          (url) => typeof url === 'string' && url.length > 0
        )
      : [];

    if (!photoUrls.length) {
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          message: 'At least one uploaded photo URL is required.',
        },
        { status: 400 }
      );
    }

    if (photoUrls.length > 8) {
      return NextResponse.json<ErrorResponse>(
        { success: false, message: 'Maximum 8 photos allowed.' },
        { status: 400 }
      );
    }

    const job = await queueEstimateJob({
      userId: session.user.id,
      photoUrls,
      photoCount: photoUrls.length,
    });

    // Presentation-style local pipeline: dispatch processing in background.
    void dispatchEstimateJob(job.id).catch((err) => {
      console.error('Estimate dispatch error:', err);
    });

    return NextResponse.json(
      {
        success: true,
        jobId: job.id,
        status: job.status,
      },
      { status: 202 }
    );
  } catch (error) {
    console.error('Estimate queue error:', error);
    return NextResponse.json<ErrorResponse>(
      {
        success: false,
        message: 'Failed to queue estimation request. Please try again.',
      },
      { status: 500 }
    );
  }
}
