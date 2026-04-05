import crypto from 'crypto';
import type { Prisma } from '@/lib/generated/prisma/client';
import { db } from '@/lib/api-helpers';
import { dispatchEstimate, generateHttpEstimate } from '@/lib/estimate/provider';

export interface EstimateJobResult {
  id: string;
  totalCost: number;
  parts: { name: string; cost: number; severity: string }[];
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
    parts: { name: string; cost: number; severity: string }[];
    summary: string;
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
  const totalCost = modelOutput.parts.reduce((sum, p) => sum + p.cost, 0);

  const result: EstimateJobResult = {
    id: estimateId,
    totalCost,
    parts: modelOutput.parts,
    photos: job.photoUrls,
    summary: modelOutput.summary,
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

export async function dispatchEstimateJob(jobId: string, appBaseUrl: string): Promise<void> {
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
    const webhookUrl = `${appBaseUrl}/api/estimate/callback`;

    // Try to dispatch async to model server. If it returns false, it means we must process sync via HTTP provider.
    const dispatched = await dispatchEstimate({
      jobId: job.id,
      userId: job.userId,
      photoUrls: job.photoUrls,
      photoCount: job.photoCount,
    }, webhookUrl);

    if (!dispatched) {
      // Synchronous fallback
      const output = await generateHttpEstimate({
        jobId: job.id,
        userId: job.userId,
        photoUrls: job.photoUrls,
        photoCount: job.photoCount,
      });
      await completeEstimateJob(job.id, output);
    }
  } catch (error) {
    await failEstimateJob(job.id, error);
  }
}
