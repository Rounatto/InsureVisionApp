import { after, NextResponse } from 'next/server';
import { db, requireAuth, requireDb } from '@/lib/api-helpers';
// Import removed
import type { ErrorResponse } from '@/types/auth';

export const runtime = 'nodejs';
export const maxDuration = 10;
const PROCESSING_TIMEOUT_MS = 5 * 60 * 1000;

/**
 * GET /api/estimate/status/[jobId]
 *
 * Poll job status until COMPLETED or FAILED.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const dbError = requireDb();
    if (dbError) return dbError;

    const { session, error: authError } = await requireAuth();
    if (authError) return authError;

    const { jobId } = await params;

    const job = await db.estimateJob.findFirst({
      where: {
        id: jobId,
        userId: session.user.id,
      },
      select: {
        id: true,
        status: true,
        result: true,
        error: true,
        createdAt: true,
        startedAt: true,
        finishedAt: true,
      },
    });

    if (!job) {
      return NextResponse.json<ErrorResponse>(
        { success: false, message: 'Estimate job not found.' },
        { status: 404 }
      );
    }

    let resolvedJob = job;

    // Recovery: mark stale PROCESSING jobs as FAILED so the client can retry.
    if (
      resolvedJob.status === 'PROCESSING' &&
      resolvedJob.startedAt &&
      Date.now() - new Date(resolvedJob.startedAt).getTime() >
        PROCESSING_TIMEOUT_MS
    ) {
      resolvedJob = await db.estimateJob.update({
        where: { id: resolvedJob.id },
        data: {
          status: 'FAILED',
          error: 'Job timed out on server',
          finishedAt: new Date(),
        },
        select: {
          id: true,
          status: true,
          result: true,
          error: true,
          createdAt: true,
          startedAt: true,
          finishedAt: true,
        },
      });
    }

    // (Removed unstable background recovery block that was duplicating processEstimateJob runs)

    return NextResponse.json({
      success: true,
      jobId: resolvedJob.id,
      status: resolvedJob.status,
      result:
        resolvedJob.status === 'COMPLETED' ? resolvedJob.result : undefined,
      error: resolvedJob.status === 'FAILED' ? resolvedJob.error : undefined,
      createdAt: resolvedJob.createdAt,
      startedAt: resolvedJob.startedAt,
      finishedAt: resolvedJob.finishedAt,
    });
  } catch (error) {
    console.error('Estimate status error:', error);
    return NextResponse.json<ErrorResponse>(
      { success: false, message: 'Failed to fetch estimate job status.' },
      { status: 500 }
    );
  }
}
