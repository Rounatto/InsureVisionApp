import crypto from 'crypto';
import type { Prisma } from '@/lib/generated/prisma/client';
import { db } from '@/lib/server/api-helpers';
import {
  generateFallbackEstimate,
  type EstimatePrediction,
  type CostEstimateResult,
  type CostPart,
} from '@/lib/server/estimate/provider';

function normalizeConfidence(confidence: number): number {
  return confidence > 1 ? confidence / 100 : confidence;
}

export interface EstimateJobResult {
  id: string;
  totalCost: number;
  parts: Array<{ name: string; cost: number; severity: string }>;
  photos: string[];
  summary: string;
  model?: unknown;
}

export async function queueEstimateJob(params: {
  userId: string;
  photoUrls: string[];
  photoCount: number;
}) {
  return db.estimateJob.create({
    data: {
      userId: params.userId,
      photoUrls: params.photoUrls,
      photoCount: params.photoCount,
      status: 'QUEUED',
    },
    select: { id: true, status: true, createdAt: true },
  });
}

function toJobErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'Failed to process estimation job.';
  }

  if (
    /stage 1 pipeline|car-parts-detector|MODEL_PIPELINE_API_URL/i.test(
      error.message
    )
  ) {
    return 'Vehicle analysis service is unavailable. Please ensure the stage 1 pipeline is running and try again.';
  }

  // Hide transient upstream details from users while preserving meaning.
  if (/Model server returned (502|503|504)/.test(error.message)) {
    return 'Estimation service is temporarily unavailable. Please try again.';
  }

  return error.message;
}

export async function failEstimateJob(jobId: string, error: unknown) {
  const message = toJobErrorMessage(error);
  await db.estimateJob.update({
    where: { id: jobId },
    data: {
      status: 'FAILED',
      error: message,
      finishedAt: new Date(),
    },
  });
}

/**
 * Convert a CostPart from the cost estimation service into the
 * EstimatePart shape used in the database and UI.
 */
function costPartToEstimatePart(cp: CostPart): {
  name: string;
  cost: number;
  severity: string;
} {
  return {
    name: `${cp.part} — ${cp.damage_type}`,
    cost: Math.round(cp.cost * 100) / 100,
    severity: cp.severity,
  };
}

/**
 * Build a human-readable summary string from cost estimation results.
 */
function buildSummary(
  costEstimate: CostEstimateResult,
  predictions: EstimatePrediction[]
): string {
  // If the cost service already produced a summary, use it (unless it's a fallback marker).
  if (
    costEstimate.summary &&
    !costEstimate.summary.includes('Fallback estimate')
  ) {
    return costEstimate.summary;
  }

  const partCount = costEstimate.parts.length;
  const total = costEstimate.total_cost;

  if (partCount === 0) {
    return 'Damage analysis completed but no specific repair costs could be determined.';
  }

  const partDescriptions = costEstimate.parts
    .map(
      (p) =>
        `${p.part} (${p.damage_type.toLowerCase()}, $${Math.round(p.cost).toLocaleString()})`
    )
    .join('; ');

  return (
    `AI damage analysis identified ${partCount} damaged component${partCount > 1 ? 's' : ''}. ` +
    `Breakdown: ${partDescriptions}. ` +
    `Estimated total repair cost: $${Math.round(total).toLocaleString()}.`
  );
}

export async function completeEstimateJob(
  jobId: string,
  modelOutput: {
    predictions: EstimatePrediction[];
    costEstimate: CostEstimateResult;
    model?: unknown;
  }
) {
  const job = await db.estimateJob.findUnique({
    where: { id: jobId },
    select: { id: true, userId: true, photoUrls: true, status: true },
  });

  if (!job || job.status !== 'PROCESSING') {
    return;
  }

  const estimateId = `EST-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

  // Convert cost parts to EstimatePart shape
  const parts = modelOutput.costEstimate.parts.map(costPartToEstimatePart);
  const totalCost = modelOutput.costEstimate.total_cost;
  const summary = buildSummary(
    modelOutput.costEstimate,
    modelOutput.predictions
  );

  const result: EstimateJobResult = {
    id: estimateId,
    totalCost: Math.round(totalCost * 100) / 100,
    parts,
    photos: job.photoUrls,
    summary,
    model: modelOutput.model,
  };

  try {
    await db.$transaction(async (tx) => {
      await tx.estimate.create({
        data: {
          id: estimateId,
          userId: job.userId,
          summary: result.summary,
          totalCost: result.totalCost,
          photos: result.photos,
          parts: {
            create: result.parts.map((p) => ({
              name: p.name,
              cost: p.cost,
              severity: p.severity,
            })),
          },
        },
      });

      await tx.estimateJob.update({
        where: { id: job.id },
        data: {
          status: 'COMPLETED',
          result: result as unknown as Prisma.InputJsonValue,
          finishedAt: new Date(),
        },
      });
    });
  } catch (err) {
    await failEstimateJob(job.id, err);
  }
}

export async function dispatchEstimateJob(jobId: string): Promise<void> {
  // Claim the job once to prevent duplicate processing from overlapping polls.
  const claimed = await db.estimateJob.updateMany({
    where: { id: jobId, status: 'QUEUED' },
    data: { status: 'PROCESSING', startedAt: new Date() },
  });

  if (claimed.count === 0) return;

  const job = await db.estimateJob.findUnique({
    where: { id: jobId },
    select: {
      id: true,
      userId: true,
      photoUrls: true,
      photoCount: true,
    },
  });

  if (!job) return;

  try {
    const output = await generateFallbackEstimate({
      jobId: job.id,
      userId: job.userId,
      photoUrls: job.photoUrls,
      photoCount: job.photoCount,
    });
    await completeEstimateJob(job.id, output);
  } catch (error) {
    await failEstimateJob(job.id, error);
  }
}
