export interface ModelPredictionResponse {
  prediction: string;
  confidence: number;
  probabilities: Record<string, number>;
}

export class ModelInferenceError extends Error {
  constructor(
    message: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = 'ModelInferenceError';
  }
}

const DEFAULT_LOCAL_MODEL_API = 'http://127.0.0.1:8000';

export function getModelApiBaseUrl(): string {
  const fromEnv = process.env.MODEL_INFERENCE_API_URL?.trim();

  if (fromEnv) return fromEnv.replace(/\/$/, '');
  if (process.env.NODE_ENV === 'development') return DEFAULT_LOCAL_MODEL_API;

  return '';
}

function toNumericProbabilityMap(
  value: unknown
): Record<string, number> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const entries = Object.entries(value as Record<string, unknown>);
  const output: Record<string, number> = {};

  for (const [label, score] of entries) {
    if (typeof score !== 'number' || !Number.isFinite(score)) {
      return null;
    }
    output[label] = score;
  }

  return output;
}

export function parseModelPredictionPayload(
  payload: unknown
): ModelPredictionResponse {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new ModelInferenceError('Model response is malformed.');
  }

  const record = payload as Record<string, unknown>;
  const prediction =
    typeof record.prediction === 'string' ? record.prediction.trim() : '';
  const confidence = record.confidence;
  const probabilities = toNumericProbabilityMap(record.probabilities);

  if (!prediction) {
    throw new ModelInferenceError('Model response missing prediction label.');
  }

  if (typeof confidence !== 'number' || !Number.isFinite(confidence)) {
    throw new ModelInferenceError('Model response has invalid confidence.');
  }

  if (!probabilities) {
    throw new ModelInferenceError('Model response has invalid probabilities.');
  }

  return {
    prediction,
    confidence,
    probabilities,
  };
}

export async function inferDamageFromModelApi(
  file: File
): Promise<ModelPredictionResponse> {
  const baseUrl = getModelApiBaseUrl();
  if (!baseUrl) {
    throw new ModelInferenceError(
      'MODEL_INFERENCE_API_URL is required outside development.',
      500
    );
  }

  const endpoint = `${baseUrl}/predict`;
  const body = new FormData();
  body.append('file', file);

  let response: Response;

  try {
    response = await fetch(endpoint, {
      method: 'POST',
      body,
      cache: 'no-store',
    });
  } catch {
    throw new ModelInferenceError(
      'Unable to reach local model API. Verify FastAPI is running.'
    );
  }

  if (!response.ok) {
    const message = await response.text().catch(() => '');
    throw new ModelInferenceError(
      message || `Model API returned ${response.status}.`,
      response.status
    );
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new ModelInferenceError('Model API returned invalid JSON.', 502);
  }

  return parseModelPredictionPayload(payload);
}
