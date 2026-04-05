import { NextResponse } from 'next/server';
import { waitUntil } from '@vercel/functions';
import {
  db,
  requireAuth,
  requireDb,
  requireRateLimit,
  requireTrustedOrigin,
} from '@/lib/api-helpers';
import { queueEstimateJob, dispatchEstimateJob } from '@/lib/estimate/jobs';
import { RL_ESTIMATE } from '@/lib/constants';
import type { ErrorResponse } from '@/types/auth';

export const runtime = 'nodejs';
export const maxDuration = 10;

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
      `estimate:${session.user.id}`,
      RL_ESTIMATE
    );
    if (rlError) return rlError;

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

    // Use waitUntil to fire dispatchEstimateJob safely in the background
    const url = new URL(req.url);
    const appBaseUrl =
      process.env.WEBHOOK_BASE_URL || `${url.protocol}//${url.host}`;
    waitUntil(dispatchEstimateJob(job.id, appBaseUrl));

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
