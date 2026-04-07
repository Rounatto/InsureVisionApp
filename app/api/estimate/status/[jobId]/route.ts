import { after, NextResponse } from 'next/server';
import { db, requireAuth, requireDb } from '@/lib/server/api-helpers';
// Import removed
import type { ErrorResponse } from '@/types/auth';

export const runtime = 'nodejs';
export const maxDuration = 10;
const PROCESSING_TIMEOUT_MS = 5 * 60 * 1000;

type NormalizedEstimateResult = {
  id: string;
  totalCost: number;
  parts: Array<{ name: string; cost: number; severity: string }>;
  photos: string[];
  summary: string;
};

function normalizeSeverity(confidence: number): string {
  if (confidence >= 0.82) return 'High';
  if (confidence >= 0.55) return 'Medium';
  return 'Low';
}

function normalizeResultShape(
  jobId: string,
  value: unknown
): NormalizedEstimateResult | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const raw = value as Record<string, unknown>;

  const id = typeof raw.id === 'string' ? raw.id : jobId;
  const photos = Array.isArray(raw.photos)
    ? raw.photos.filter((p): p is string => typeof p === 'string')
    : [];

  const rawParts = Array.isArray(raw.parts)
    ? raw.parts
        .map((part) => {
          if (!part || typeof part !== 'object' || Array.isArray(part)) {
            return null;
          }
          const p = part as Record<string, unknown>;
          if (typeof p.name !== 'string') return null;
          const cost =
            typeof p.cost === 'number' && Number.isFinite(p.cost) ? p.cost : 0;
          const severity = typeof p.severity === 'string' ? p.severity : 'Low';
          return { name: p.name, cost, severity };
        })
        .filter((p): p is { name: string; cost: number; severity: string } =>
          Boolean(p)
        )
    : [];

  let totalCost =
    typeof raw.totalCost === 'number' && Number.isFinite(raw.totalCost)
      ? raw.totalCost
      : 0;

  const confidenceThreshold =
    typeof raw.confidenceThreshold === 'number' ? raw.confidenceThreshold : 0.6;

  const predictedParts = Array.isArray(raw.predictions)
    ? raw.predictions
        .map((prediction, index) => {
          if (
            !prediction ||
            typeof prediction !== 'object' ||
            Array.isArray(prediction)
          ) {
            return null;
          }
          const p = prediction as Record<string, unknown>;
          const label =
            typeof p.prediction === 'string' ? p.prediction : 'Unknown';
          const confidence =
            typeof p.confidence === 'number' && Number.isFinite(p.confidence)
              ? p.confidence
              : 0;

          return {
            name: `Detection ${index + 1}: ${label}`,
            cost: Math.max(
              1,
              Math.round((confidence > 1 ? confidence / 100 : confidence) * 100)
            ),
            severity:
              confidence >= confidenceThreshold
                ? normalizeSeverity(
                    confidence > 1 ? confidence / 100 : confidence
                  )
                : 'Low',
          };
        })
        .filter((p): p is { name: string; cost: number; severity: string } =>
          Boolean(p)
        )
    : [];

  const parts = rawParts.length ? rawParts : predictedParts;

  if (!totalCost) {
    const costEstimate = raw.costEstimate as
      | Record<string, unknown>
      | undefined;
    if (
      costEstimate &&
      typeof costEstimate.total === 'number' &&
      Number.isFinite(costEstimate.total)
    ) {
      totalCost = costEstimate.total;
    } else {
      totalCost = parts.reduce((sum, part) => sum + part.cost, 0);
    }
  }

  let summary = typeof raw.summary === 'string' ? raw.summary : '';
  if (summary.trim().startsWith('{')) {
    summary = `Damage analysis completed with ${parts.length} detected item${parts.length === 1 ? '' : 's'}.`;
  }
  if (!summary) {
    summary = 'Damage analysis completed.';
  }

  return {
    id,
    totalCost,
    parts,
    photos,
    summary,
  };
}

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

    const normalizedResult =
      resolvedJob.status === 'COMPLETED'
        ? normalizeResultShape(resolvedJob.id, resolvedJob.result)
        : undefined;

    return NextResponse.json({
      success: true,
      jobId: resolvedJob.id,
      status: resolvedJob.status,
      result: normalizedResult,
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
