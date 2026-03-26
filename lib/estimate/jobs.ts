import crypto from 'crypto';
import type { Prisma } from '@/lib/generated/prisma/client';
import { db } from '@/lib/api-helpers';
import { generateEstimate } from '@/lib/estimate/provider';

interface EstimateJobResult {
  id: string;
  totalCost: number;
  parts: { name: string; cost: number; severity: string }[];
  photos: string[];
  summary: string;
  model?: unknown;
}

/**
 * Single model gateway for estimation jobs.
 * Swap mock -> real model implementation by changing provider wiring only.
 */
async function runEstimateModel(params: {
  estimateId: string;
  userId: string;
  photoUrls: string[];
  photoCount: number;
}) {
  return generateEstimate(params);
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

export async function processEstimateJob(jobId: string): Promise<void> {
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
    const estimateId = `EST-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

    const modelOutput = await runEstimateModel({
      estimateId,
      userId: job.userId,
      photoUrls: job.photoUrls,
      photoCount: job.photoCount,
    });

    const totalCost = modelOutput.parts.reduce((sum, p) => sum + p.cost, 0);

    const result: EstimateJobResult = {
      id: estimateId,
      totalCost,
      parts: modelOutput.parts,
      photos: job.photoUrls,
      summary: modelOutput.summary,
      model: modelOutput.model,
    };

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
  } catch (error) {
    const message = toJobErrorMessage(error);

    await db.estimateJob.update({
      where: { id: job.id },
      data: {
        status: 'FAILED',
        error: message,
        finishedAt: new Date(),
      },
    });
  }
}
