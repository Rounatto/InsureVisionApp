import { aiApiKey, aiEndpoint, aiProvider, aiTimeoutMs } from '@/config/ai';

export interface EstimatePart {
  name: string;
  cost: number;
  severity: string;
}

export interface EstimateModelInput {
  estimateId: string;
  userId: string;
  photoUrls: string[];
  photoCount: number;
}

export interface EstimateModelOutput {
  parts: EstimatePart[];
  summary: string;
  model?: {
    provider: 'model-server' | 'http';
    perPhoto?: Array<{
      photoUrl: string;
      topLabel: string;
      confidence: number;
      isDamaged: boolean;
      scores?: unknown;
    }>;
  };
}

interface ModelServerPredictResponse {
  job_id?: string;
  top_label?: string;
  confidence?: number;
  scores?: unknown;
  is_damaged?: boolean;
}

const modelServerUrl = (process.env.MODEL_SERVER_URL || '').replace(/\/$/, '');
const modelApiKey = process.env.MODEL_API_KEY || '';
const modelRetries = Math.max(1, Number(process.env.MODEL_RETRIES || 3));

class ModelServerError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ModelServerError';
    this.status = status;
  }

  get retryable(): boolean {
    return this.status === 429 || this.status >= 500;
  }
}

function normalizeModelOutput(data: unknown): EstimateModelOutput | null {
  if (!data || typeof data !== 'object') return null;

  const payload = data as { parts?: unknown; summary?: unknown };
  if (!Array.isArray(payload.parts) || typeof payload.summary !== 'string')
    return null;

  const parts: EstimatePart[] = [];
  for (const item of payload.parts) {
    if (!item || typeof item !== 'object') return null;
    const part = item as { name?: unknown; cost?: unknown; severity?: unknown };

    if (typeof part.name !== 'string') return null;
    if (typeof part.cost !== 'number' || !Number.isFinite(part.cost))
      return null;
    if (typeof part.severity !== 'string') return null;

    parts.push({
      name: part.name,
      cost: part.cost,
      severity: part.severity,
    });
  }

  if (!parts.length) return null;

  return {
    parts,
    summary: payload.summary,
  };
}

async function callHttpProvider(
  input: EstimateModelInput
): Promise<EstimateModelOutput> {
  if (!aiEndpoint) {
    throw new Error('AI_ENDPOINT is missing.');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), aiTimeoutMs);

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (aiApiKey) {
      headers.Authorization = `Bearer ${aiApiKey}`;
    }

    const res = await fetch(aiEndpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(input),
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`AI provider returned status ${res.status}`);
    }

    const raw = await res.json();
    const normalized = normalizeModelOutput(raw);

    if (!normalized) {
      throw new Error('AI provider response format is invalid.');
    }

    return normalized;
  } finally {
    clearTimeout(timeout);
  }
}

function titleCaseLabel(label: string): string {
  return label
    .replace(/[_-]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function mapPredictionToPart(prediction: {
  photoIndex: number;
  topLabel: string;
  confidence: number;
  isDamaged: boolean;
}): EstimatePart {
  let severity: 'High' | 'Medium' | 'Low' = 'Low';
  if (prediction.confidence >= 0.82) severity = 'High';
  else if (prediction.confidence >= 0.55) severity = 'Medium';

  const confidencePct = Math.round(prediction.confidence * 100);
  return {
    name: `Photo ${prediction.photoIndex}: ${titleCaseLabel(prediction.topLabel || 'Unknown')}`,
    severity: prediction.isDamaged ? severity : 'Low',
    cost: prediction.isDamaged ? Math.max(1, confidencePct) : 0,
  };
}

async function callModelServerOnce(params: {
  photoUrl: string;
  jobId: string;
}): Promise<ModelServerPredictResponse> {
  if (!modelServerUrl) {
    throw new Error('MODEL_SERVER_URL is missing.');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), aiTimeoutMs);

  try {
    const res = await fetch(`${modelServerUrl}/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(modelApiKey ? { 'x-api-secret': modelApiKey } : {}),
      },
      body: JSON.stringify({
        photo_url: params.photoUrl,
        job_id: params.jobId,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new ModelServerError(
        res.status,
        `Model server returned ${res.status}${body ? `: ${body.slice(0, 180)}` : ''}`
      );
    }

    const data = (await res.json()) as ModelServerPredictResponse;
    if (typeof data?.top_label !== 'string') {
      throw new Error('Model server response missing top_label.');
    }

    return data;
  } finally {
    clearTimeout(timeout);
  }
}

async function callModelServerWithRetry(params: {
  photoUrl: string;
  jobId: string;
}): Promise<ModelServerPredictResponse> {
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= modelRetries; attempt++) {
    try {
      return await callModelServerOnce(params);
    } catch (error) {
      lastError = error;

      const retryable =
        error instanceof ModelServerError ? error.retryable : true;

      if (!retryable) {
        break;
      }

      if (attempt >= modelRetries) break;

      const backoffMs = Math.min(5000, 1000 * 2 ** (attempt - 1));
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('Model server call failed.');
}

async function callModelServerProvider(
  input: EstimateModelInput
): Promise<EstimateModelOutput> {
  const settled = await Promise.allSettled(
    input.photoUrls.map((photoUrl) =>
      callModelServerWithRetry({
        photoUrl,
        jobId: input.estimateId,
      })
    )
  );

  const successfulPredictions = settled
    .map((result, index) => {
      if (result.status !== 'fulfilled') return null;
      return {
        photoUrl: input.photoUrls[index],
        topLabel: result.value.top_label || 'detected_damage',
        confidence:
          typeof result.value.confidence === 'number'
            ? result.value.confidence
            : 0.5,
        isDamaged:
          typeof result.value.is_damaged === 'boolean'
            ? result.value.is_damaged
            : true,
        scores: result.value.scores,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  if (successfulPredictions.length === 0) {
    const firstError = settled.find((r) => r.status === 'rejected') as
      | PromiseRejectedResult
      | undefined;
    throw new Error(
      firstError?.reason instanceof Error
        ? firstError.reason.message
        : 'Model server failed for all photos.'
    );
  }

  const parts = successfulPredictions.map((prediction, index) =>
    mapPredictionToPart({
      photoIndex: index + 1,
      topLabel: prediction.topLabel,
      confidence: prediction.confidence,
      isDamaged: prediction.isDamaged,
    })
  );
  const damagedCount = successfulPredictions.filter((p) => p.isDamaged).length;
  const failedCount = input.photoUrls.length - successfulPredictions.length;
  const labelsSummary = successfulPredictions
    .map(
      (p, i) =>
        `photo ${i + 1}: ${titleCaseLabel(p.topLabel)} (${Math.round(p.confidence * 100)}%)`
    )
    .join('; ');

  const summary = `Model analysis completed for ${successfulPredictions.length}/${input.photoUrls.length} photo${input.photoUrls.length > 1 ? 's' : ''}. Detected damage indications in ${damagedCount} photo${damagedCount !== 1 ? 's' : ''}. Predictions: ${labelsSummary}${failedCount > 0 ? `. ${failedCount} photo${failedCount > 1 ? 's were' : ' was'} retried or unavailable` : ''}.`;

  return {
    parts,
    summary,
    model: {
      provider: 'model-server',
      perPhoto: successfulPredictions,
    },
  };
}

export async function generateEstimate(
  input: EstimateModelInput
): Promise<EstimateModelOutput> {
  if (modelServerUrl) {
    return callModelServerProvider(input);
  }

  if (aiProvider === 'http') {
    return callHttpProvider(input);
  }

  throw new Error(
    'No estimate inference provider configured. Set MODEL_SERVER_URL or AI_PROVIDER=http with AI_ENDPOINT.'
  );
}
