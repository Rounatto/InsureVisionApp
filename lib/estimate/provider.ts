import { aiApiKey, aiEndpoint, aiProvider, aiTimeoutMs } from '@/config/ai';

export interface EstimatePart {
  name: string;
  cost: number;
  severity: string;
}

export interface EstimateModelInput {
  jobId: string;
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
      topLabel: string | null;
      confidence: number | null;
      scores?: unknown;
    }>;
  };
}

const modelServerUrl = (process.env.MODEL_SERVER_URL || '').replace(/\/$/, '');
const modelApiKey = process.env.MODEL_API_KEY || '';

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

export async function generateHttpEstimate(
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
  topLabel: string | null;
  confidence: number | null;
}): EstimatePart {
  const conf = prediction.confidence ?? 0;
  const confidencePct = Math.round(conf * 100);

  let severity: 'High' | 'Medium' | 'Low' = 'Low';
  if (conf >= 0.82) severity = 'High';
  else if (conf >= 0.55) severity = 'Medium';

  return {
    name: `Photo ${prediction.photoIndex}: ${titleCaseLabel(prediction.topLabel || 'Unknown')}`,
    severity,
    cost: Math.max(1, confidencePct),
  };
}

export function processWebhookToOutput(
  photoUrls: string[],
  predictions: Array<{
    photo_url: string;
    top_label: string | null;
    confidence: number | null;
    scores?: unknown;
  }>
): EstimateModelOutput {
  const successfulPredictions: Array<{
    photoUrl: string;
    topLabel: string | null;
    confidence: number | null;
    scores: unknown;
  }> = [];

  const parts: EstimatePart[] = [];

  photoUrls.forEach((url, i) => {
    const prediction = predictions.find((p) => p.photo_url === url);
    if (prediction) {
      successfulPredictions.push({
        photoUrl: prediction.photo_url,
        topLabel: prediction.top_label,
        confidence: prediction.confidence,
        scores: prediction.scores,
      });
      parts.push(
        mapPredictionToPart({
          photoIndex: i + 1,
          topLabel: prediction.top_label,
          confidence: prediction.confidence,
        })
      );
    }
  });

  const failedCount = photoUrls.length - successfulPredictions.length;
  const labelsSummary = successfulPredictions
    .map(
      (p, i) =>
        `photo ${i + 1}: ${titleCaseLabel(p.topLabel || 'Unknown')} (${Math.round((p.confidence ?? 0) * 100)}%)`
    )
    .join('; ');

  const summary = `Model analysis completed for ${successfulPredictions.length}/${photoUrls.length} photo${photoUrls.length > 1 ? 's' : ''}. Predictions: ${labelsSummary}${failedCount > 0 ? `. ${failedCount} photo${failedCount > 1 ? 's were' : ' was'} retried or unavailable` : ''}.`;

  return {
    parts,
    summary,
    model: {
      provider: 'model-server',
      perPhoto: successfulPredictions,
    },
  };
}

async function dispatchModelServerProvider(
  input: EstimateModelInput,
  webhookUrl: string
): Promise<void> {
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
        job_id: input.jobId,
        photo_urls: input.photoUrls,
        webhook_url: webhookUrl,
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
  } finally {
    clearTimeout(timeout);
  }
}

export async function dispatchEstimate(
  input: EstimateModelInput,
  webhookUrl: string
): Promise<boolean> {
  if (modelServerUrl) {
    await dispatchModelServerProvider(input, webhookUrl);
    return true; // async dispatched
  }

  if (aiProvider === 'http') {
    return false; // not async dispatched, fallback to synchronous HTTP
  }

  throw new Error(
    'No estimate inference provider configured. Set MODEL_SERVER_URL or AI_PROVIDER=http with AI_ENDPOINT.'
  );
}
