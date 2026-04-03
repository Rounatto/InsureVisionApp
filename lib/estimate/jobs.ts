import crypto from 'crypto';
import type { Prisma } from '@/lib/generated/prisma/client';
import { db } from '@/lib/api-helpers';
import {
  generateFallbackEstimate,
  type EstimatePrediction,
} from '@/lib/estimate/provider';

const CONFIDENCE_THRESHOLD = 0.6;
const COST_MODEL_PLACEHOLDER_TOTAL_USD = 2500;

function normalizeConfidence(confidence: number): number {
  return confidence > 1 ? confidence / 100 : confidence;
}

function isConfidentPrediction(prediction: EstimatePrediction): boolean {
  return normalizeConfidence(prediction.confidence) >= CONFIDENCE_THRESHOLD;
}

interface CostEstimatePlaceholder {
  model: 'cost-model-placeholder-v1';
  currency: 'USD';
  total: number;
  note: string;
}

export interface EstimateJobResult {
  id: string;
  predictions: EstimatePrediction[];
  confidentPredictions: EstimatePrediction[];
  confidenceThreshold: number;
  costEstimate: CostEstimatePlaceholder;
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

export async function completeEstimateJob(
  jobId: string,
  modelOutput: {
    predictions: EstimatePrediction[];
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
  const confidentPredictions = modelOutput.predictions.filter(
    isConfidentPrediction
  );

  const costEstimate: CostEstimatePlaceholder = {
    model: 'cost-model-placeholder-v1',
    currency: 'USD',
    total: COST_MODEL_PLACEHOLDER_TOTAL_USD,
    note: 'Placeholder until cost-estimation model is integrated.',
  };

  const summary = JSON.stringify({
    confidentPredictions,
    confidenceThreshold: CONFIDENCE_THRESHOLD,
    costEstimate,
  });

  const result: EstimateJobResult = {
    id: estimateId,
    predictions: modelOutput.predictions,
    confidentPredictions,
    confidenceThreshold: CONFIDENCE_THRESHOLD,
    costEstimate,
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
          totalCost: costEstimate.total,
          photos: result.photos,
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
