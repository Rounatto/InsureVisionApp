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

const DAMAGE_PROFILE_OVERRIDES: Record<
  string,
  { name: string; severity: 'High' | 'Medium' | 'Low'; baseCost: number }
> = {
  bumper: { name: 'Front Bumper', severity: 'High', baseCost: 850 },
  hood: { name: 'Hood', severity: 'Medium', baseCost: 650 },
  headlight: { name: 'Headlight Assembly', severity: 'High', baseCost: 780 },
  fender: { name: 'Fender', severity: 'Medium', baseCost: 540 },
  door: { name: 'Door Panel', severity: 'Medium', baseCost: 520 },
  grille: { name: 'Front Grille', severity: 'Low', baseCost: 240 },
  scratch: { name: 'Paint and Surface Repair', severity: 'Low', baseCost: 260 },
  dent: { name: 'Panel Dent Repair', severity: 'Medium', baseCost: 430 },
  crack: {
    name: 'Body Component Replacement',
    severity: 'High',
    baseCost: 980,
  },
};

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
  topLabel: string;
  confidence: number;
  isDamaged: boolean;
}): EstimatePart {
  const label = prediction.topLabel.toLowerCase();
  const override = Object.entries(DAMAGE_PROFILE_OVERRIDES).find(([key]) =>
    label.includes(key)
  )?.[1];

  let severity: 'High' | 'Medium' | 'Low' = 'Low';
  if (prediction.confidence >= 0.82) severity = 'High';
  else if (prediction.confidence >= 0.55) severity = 'Medium';

  if (override) {
    const scaledCost = Math.round(
      override.baseCost * (0.7 + prediction.confidence * 0.6)
    );
    return {
      name: override.name,
      severity: prediction.isDamaged ? override.severity : 'Low',
      cost: prediction.isDamaged
        ? scaledCost
        : Math.max(120, scaledCost * 0.35),
    };
  }

  const base = severity === 'High' ? 900 : severity === 'Medium' ? 520 : 260;
  const cost = Math.round(base * (0.6 + prediction.confidence * 0.7));
  return {
    name: titleCaseLabel(prediction.topLabel || 'Detected Damage'),
    severity: prediction.isDamaged ? severity : 'Low',
    cost: prediction.isDamaged ? cost : Math.max(100, Math.round(cost * 0.4)),
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
      throw new Error(
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
      if (attempt >= modelRetries) break;

      const backoffMs = attempt * 600;
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

  const deduped = new Map<string, EstimatePart>();
  for (const prediction of successfulPredictions) {
    const part = mapPredictionToPart(prediction);
    const key = part.name.toLowerCase();
    const existing = deduped.get(key);
    if (!existing || part.cost > existing.cost) {
      deduped.set(key, part);
    }
  }

  const parts = Array.from(deduped.values()).slice(0, 8);
  const damagedCount = successfulPredictions.filter((p) => p.isDamaged).length;
  const failedCount = input.photoUrls.length - successfulPredictions.length;

  const summary = `Model analysis completed for ${successfulPredictions.length}/${input.photoUrls.length} photo${input.photoUrls.length > 1 ? 's' : ''}. Detected damage indications in ${damagedCount} photo${damagedCount !== 1 ? 's' : ''}${failedCount > 0 ? ` with ${failedCount} photo${failedCount > 1 ? 's' : ''} retried or unavailable.` : '.'}`;

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
