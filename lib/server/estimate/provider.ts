import {
  inferDamageFromModelApiAllDetections,
  getModelApiBaseUrl,
  type ModelPredictionResponse,
} from '@/lib/server/model-inference';

export interface EstimatePrediction {
  photoUrl: string;
  prediction: string;
  confidence: number;
  probabilities: Record<string, number>;
  partLabel?: string;
}

export interface CostPart {
  part: string;
  damage_type: string;
  cost: number;
  confidence: number;
  severity: string;
}

export interface CostEstimateResult {
  parts: CostPart[];
  total_cost: number;
  currency: string;
  summary: string;
}

export interface EstimateModelInput {
  jobId: string;
  userId: string;
  photoUrls: string[];
  photoCount: number;
}

export interface EstimateModelOutput {
  predictions: EstimatePrediction[];
  costEstimate: CostEstimateResult;
  model?: {
    provider: 'local-model';
    perPhoto?: Array<{
      photoUrl: string;
      topLabel: string | null;
      confidence: number | null;
      scores?: unknown;
    }>;
  };
}

const COST_SERVICE_TIMEOUT_MS = 15_000;

function getCostEstimationApiUrl(): string {
  const fromEnv = process.env.COST_ESTIMATION_API_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  if (process.env.NODE_ENV === 'development') return 'http://127.0.0.1:8002';
  return '';
}

function hasLocalModelInferenceProvider(): boolean {
  return Boolean(getModelApiBaseUrl());
}

async function fetchPhotoAsFile(
  photoUrl: string,
  photoIndex: number
): Promise<File> {
  const res = await fetch(photoUrl, { cache: 'no-store' });

  if (!res.ok) {
    throw new Error(
      `Failed to fetch uploaded photo ${photoIndex} (status ${res.status}).`
    );
  }

  const blob = await res.blob();
  const contentType = blob.type || 'image/jpeg';
  const extension = contentType.includes('png') ? 'png' : 'jpg';

  return new File([blob], `estimate-photo-${photoIndex}.${extension}`, {
    type: contentType,
  });
}

/**
 * Derive a part label from a detection's context.
 *
 * When the Stage 1 pipeline returns detections, each detection has a
 * `part_label` from YOLO. The model-inference parser now preserves
 * this as `partLabel`. We use it directly when available, falling back
 * to a generic label.
 */
function inferPartLabel(prediction: ModelPredictionResponse, index: number): string {
  if (prediction.partLabel) {
    return prediction.partLabel;
  }
  // Fallback: no part label from the pipeline
  return `detected_part_${index + 1}`;
}

/**
 * Call the Stage 3 cost estimation service with pipeline detections.
 */
async function fetchCostEstimate(
  predictions: EstimatePrediction[]
): Promise<CostEstimateResult> {
  const costUrl = getCostEstimationApiUrl();

  if (!costUrl) {
    console.warn(
      '[estimate] COST_ESTIMATION_API_URL not set. Using fallback cost estimation.'
    );
    return buildFallbackCostEstimate(predictions);
  }

  const detections = predictions.map((p) => ({
    part_label: p.partLabel || 'bumper',
    damage_type: p.prediction,
    confidence: p.confidence,
    probabilities: p.probabilities,
  }));

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), COST_SERVICE_TIMEOUT_MS);

  try {
    const res = await fetch(`${costUrl}/estimate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ detections }),
      signal: controller.signal,
      cache: 'no-store',
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => '');
      console.error(
        `[estimate] Cost service returned ${res.status}: ${errorText.slice(0, 200)}`
      );
      return buildFallbackCostEstimate(predictions);
    }

    const data = (await res.json()) as CostEstimateResult;

    // Validate response shape
    if (
      !data ||
      !Array.isArray(data.parts) ||
      typeof data.total_cost !== 'number'
    ) {
      console.error('[estimate] Cost service returned invalid response shape.');
      return buildFallbackCostEstimate(predictions);
    }

    return data;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.error('[estimate] Cost service timed out.');
    } else {
      console.error('[estimate] Cost service error:', error);
    }
    return buildFallbackCostEstimate(predictions);
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Fallback cost estimation when the Stage 3 service is unavailable.
 * Uses a simple heuristic based on damage type and confidence.
 */
function buildFallbackCostEstimate(
  predictions: EstimatePrediction[]
): CostEstimateResult {
  const baseCosts: Record<string, number> = {
    crack: 300,
    dent: 250,
    scratch: 150,
    'glass shatter': 600,
    'lamp broken': 400,
    'tire flat': 350,
    broken_part: 500,
    rust: 400,
    paint_damage: 200,
  };

  const parts: CostPart[] = predictions.map((p) => {
    const baseCost = baseCosts[p.prediction.toLowerCase()] ?? 300;
    const conf = p.confidence > 1 ? p.confidence / 100 : p.confidence;
    const cost = Math.round(baseCost * (0.5 + conf * 0.5));
    const severity = conf >= 0.8 ? 'High' : conf >= 0.55 ? 'Medium' : 'Low';

    return {
      part: (p.partLabel || p.prediction).replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      damage_type: p.prediction.replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      cost,
      confidence: Math.round(p.confidence * 100) / 100,
      severity,
    };
  });

  const total_cost = parts.reduce((sum, p) => sum + p.cost, 0);

  const partsSummary = parts
    .map((p) => `${p.part} (${p.damage_type.toLowerCase()}, $${p.cost})`)
    .join(', ');

  return {
    parts,
    total_cost,
    currency: 'USD',
    summary: `Estimated repair cost for ${parts.length} damaged part${parts.length !== 1 ? 's' : ''}: ${partsSummary}. Total: $${total_cost}. (Fallback estimate — cost service unavailable)`,
  };
}

async function generateLocalModelEstimate(
  input: EstimateModelInput
): Promise<EstimateModelOutput> {
  const perPhoto: Array<{
    photoUrl: string;
    topLabel: string | null;
    confidence: number | null;
    scores?: unknown;
  }> = [];

  const predictions: EstimatePrediction[] = [];
  const errors: string[] = [];

  for (let i = 0; i < input.photoUrls.length; i++) {
    const photoUrl = input.photoUrls[i];
    const photoIndex = i + 1;

    try {
      const file = await fetchPhotoAsFile(photoUrl, photoIndex);
      const allPredictions = await inferDamageFromModelApiAllDetections(file);

      // Add each detected part as a separate prediction result
      for (let j = 0; j < allPredictions.length; j++) {
        const prediction = allPredictions[j];
        perPhoto.push({
          photoUrl,
          topLabel: prediction.prediction,
          confidence: prediction.confidence,
          scores: prediction.probabilities,
        });

        predictions.push({
          photoUrl,
          prediction: prediction.prediction,
          confidence: prediction.confidence,
          probabilities: prediction.probabilities,
          partLabel: inferPartLabel(prediction, j),
        });
      }
    } catch (error) {
      // Continue processing remaining photos while collecting failure context.
      const message =
        error instanceof Error
          ? error.message
          : `Stage 1 pipeline failed for photo ${photoIndex}.`;
      errors.push(message);
    }
  }

  if (!predictions.length) {
    throw new Error(
      errors[0] || 'Stage 1 pipeline could not analyze any uploaded photos.'
    );
  }

  // ── Stage 3: Get cost estimates ─────────────────────────────────────────
  const costEstimate = await fetchCostEstimate(predictions);

  return {
    predictions,
    costEstimate,
    model: {
      provider: 'local-model',
      perPhoto,
    },
  };
}

export async function generateFallbackEstimate(
  input: EstimateModelInput
): Promise<EstimateModelOutput> {
  if (hasLocalModelInferenceProvider()) {
    return generateLocalModelEstimate(input);
  }

  throw new Error(
    'MODEL_PIPELINE_API_URL (or MODEL_INFERENCE_API_URL) is required for local estimation.'
  );
}
