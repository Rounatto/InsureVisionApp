export interface ModelPredictionResponse {
  prediction: string;
  confidence: number;
  probabilities: Record<string, number>;
}

export type ModelPredictionResponseOrArray = ModelPredictionResponse | ModelPredictionResponse[];

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
  // Prefer the explicit stage-1 pipeline URL, while keeping backward compatibility.
  const fromPipelineEnv = process.env.MODEL_PIPELINE_API_URL?.trim();
  const fromLegacyEnv = process.env.MODEL_INFERENCE_API_URL?.trim();
  const fromEnv = fromPipelineEnv || fromLegacyEnv;

  if (fromEnv) return fromEnv.replace(/\/$/, '');
  if (process.env.NODE_ENV === 'development') return DEFAULT_LOCAL_MODEL_API;

  return '';
}

function toNumericProbabilityMap(
  value: unknown
): Record<string, number> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    if (Array.isArray(value)) {
      const out: Record<string, number> = {};
      for (const item of value) {
        if (!item || typeof item !== 'object' || Array.isArray(item)) {
          return null;
        }
        const rec = item as Record<string, unknown>;
        const label =
          firstString(rec, ['label', 'class', 'name', 'prediction']) || '';
        const score = firstNumber(rec, ['score', 'confidence', 'probability']);
        if (!label || score === null) return null;
        out[label] = score;
      }
      return Object.keys(out).length > 0 ? out : null;
    }
    return null;
  }

  const entries = Object.entries(value as Record<string, unknown>);
  const output: Record<string, number> = {};

  for (const [label, score] of entries) {
    const numeric = toFiniteNumber(score);
    if (numeric === null) {
      return null;
    }
    output[label] = numeric;
  }

  return output;
}

function extractPredictionHeuristically(
  record: Record<string, unknown>
): ModelPredictionResponse | null {
  const hasDamageContext = Object.keys(record).some(
    (key) => /damage|prediction|probabilit|score/i.test(key)
  );
  if (!hasDamageContext) return null;

  let prediction = '';
  let confidence: number | null = null;

  const preferredPredictionKeys = [
    'prediction',
    'damage_class',
    'damage_label',
    'damage_type',
    'top_label',
  ];
  prediction = firstString(record, preferredPredictionKeys);

  const preferredConfidenceKeys = [
    'confidence',
    'damage_confidence',
    'score',
    'probability',
    'conf',
  ];
  confidence = firstNumber(record, preferredConfidenceKeys);

  if (!prediction) {
    for (const [key, value] of Object.entries(record)) {
      if (typeof value !== 'string' || !value.trim()) continue;
      if (/(prediction|label|class|damage|type|name)/i.test(key)) {
        prediction = value.trim();
        break;
      }
    }
  }

  if (confidence === null) {
    for (const [key, value] of Object.entries(record)) {
      if (!/(confidence|score|prob)/i.test(key)) continue;
      const parsed = toFiniteNumber(value);
      if (parsed !== null) {
        confidence = parsed;
        break;
      }
    }
  }

  if (!prediction || confidence === null) return null;

  return {
    prediction,
    confidence,
    probabilities: { [prediction]: confidence },
  };
}

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function firstString(
  record: Record<string, unknown>,
  keys: string[]
): string {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function firstNumber(
  record: Record<string, unknown>,
  keys: string[]
): number | null {
  for (const key of keys) {
    const numeric = toFiniteNumber(record[key]);
    if (numeric !== null) return numeric;
  }
  return null;
}

function firstProbabilityMap(
  record: Record<string, unknown>,
  keys: string[]
): Record<string, number> | null {
  for (const key of keys) {
    const parsed = toNumericProbabilityMap(record[key]);
    if (parsed) return parsed;
  }
  return null;
}

function extractPredictionFromRecord(
  record: Record<string, unknown>
): ModelPredictionResponse | null {
  const prediction = firstString(record, [
    'prediction',
    'top_label',
    'damage_type',
    'damage_label',
    'damage_class',
  ]);

  const probabilities = firstProbabilityMap(record, [
    'probabilities',
    'scores',
    'damage_scores',
    'damage_probabilities',
    'class_probabilities',
  ]);

  const predictedFromProbabilities = !prediction && probabilities
    ? Object.entries(probabilities).sort((a, b) => b[1] - a[1])[0]?.[0] ?? ''
    : prediction;

  const confidence =
    firstNumber(record, [
      'confidence',
      'score',
      'probability',
      'damage_confidence',
    ]) ??
    (predictedFromProbabilities && probabilities
      ? toFiniteNumber(probabilities[predictedFromProbabilities])
      : null);

  if (!predictedFromProbabilities || confidence === null) return null;

  return {
    prediction: predictedFromProbabilities,
    confidence,
    probabilities:
      probabilities ?? { [predictedFromProbabilities]: confidence },
  };
}

function collectPredictionCandidates(
  value: unknown,
  depth = 0
): ModelPredictionResponse[] {
  if (depth > 5 || value === null || value === undefined) return [];

  if (Array.isArray(value)) {
    const fromItems: ModelPredictionResponse[] = [];
    for (const item of value) {
      fromItems.push(...collectPredictionCandidates(item, depth + 1));
    }
    return fromItems;
  }

  if (typeof value !== 'object') return [];

  const record = value as Record<string, unknown>;
  const candidates: ModelPredictionResponse[] = [];

  const direct = extractPredictionFromRecord(record);
  if (direct) {
    candidates.push(direct);
  } else {
    const heuristic = extractPredictionHeuristically(record);
    if (heuristic) candidates.push(heuristic);
  }

  const preferredNestedKeys = [
    'result',
    'data',
    'output',
    'prediction',
    'predictions',
    'results',
    'detections',
    'parts',
    'classification',
    'classifications',
    'damage',
    'damage_classification',
    'damage_result',
    'stage2',
  ];

  for (const key of preferredNestedKeys) {
    candidates.push(...collectPredictionCandidates(record[key], depth + 1));
  }

  // Fallback scan: catch unknown nesting keys without traversing too deep.
  if (depth < 2) {
    for (const nested of Object.values(record)) {
      if (nested && typeof nested === 'object') {
        candidates.push(...collectPredictionCandidates(nested, depth + 1));
      }
    }
  }

  return candidates;
}

function isInformativeDamageCandidate(
  candidate: ModelPredictionResponse
): boolean {
  const labels = Object.keys(candidate.probabilities);
  if (labels.length > 1) return true;

  // Single-label probability maps are often synthesized fallback values
  // from detector-only records; keep only if the label differs.
  if (labels.length === 1 && labels[0] !== candidate.prediction) return true;

  return false;
}

function dedupeCandidates(
  candidates: ModelPredictionResponse[]
): ModelPredictionResponse[] {
  const seen = new Set<string>();
  const unique: ModelPredictionResponse[] = [];

  for (const candidate of candidates) {
    const probs = Object.entries(candidate.probabilities)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([label, score]) => `${label}:${Number(score).toFixed(4)}`)
      .join('|');

    const key = `${candidate.prediction}|${Number(candidate.confidence).toFixed(
      4
    )}|${probs}`;

    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(candidate);
  }

  return unique;
}

export function parseModelPredictionPayload(
  payload: unknown
): ModelPredictionResponseOrArray {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new ModelInferenceError('Model response is malformed.');
  }

  const record = payload as Record<string, unknown>;

  // Stage-1 pipeline response should contain detections. We only accept it when
  // we can extract downstream damage classifications from those detections.
  if (Array.isArray(record.detections)) {
    const detectionCandidates = collectPredictionCandidates(record.detections);
    const informative = detectionCandidates.filter(isInformativeDamageCandidate);
    const deduped = dedupeCandidates(
      informative.length > 0 ? informative : detectionCandidates
    );

    if (deduped.length > 0) {
      deduped.sort((a, b) => b.confidence - a.confidence);
      return deduped;
    }

    const firstDetectionKeys = Object.keys(
      ((record.detections[0] as Record<string, unknown> | undefined) ?? {})
    )
      .slice(0, 10)
      .join(', ');

    throw new ModelInferenceError(
      firstDetectionKeys
        ? `Stage 1 returned detections but no damage classifications were found. This usually means stage 2 classification failed. detection[0] keys: ${firstDetectionKeys}`
        : 'Stage 1 returned detections but no damage classifications were found. This usually means stage 2 classification failed.'
    );
  }

  const candidates = collectPredictionCandidates(record);
  if (candidates.length > 0) {
    const deduped = dedupeCandidates(candidates);
    deduped.sort((a, b) => b.confidence - a.confidence);
    return deduped[0];
  }

  const responseKeys = Object.keys(record).slice(0, 10).join(', ');
  const firstDetectionKeys = Array.isArray(record.detections)
    ? Object.keys(
        ((record.detections[0] as Record<string, unknown> | undefined) ?? {})
      )
        .slice(0, 10)
        .join(', ')
    : '';
  throw new ModelInferenceError(
    responseKeys
      ? firstDetectionKeys
        ? `Model response format is unsupported by the webapp parser. Keys: ${responseKeys}. detection[0] keys: ${firstDetectionKeys}`
        : `Model response format is unsupported by the webapp parser. Keys: ${responseKeys}`
      : 'Model response format is unsupported by the webapp parser.'
  );
}

export async function inferDamageFromModelApi(
  file: File
): Promise<ModelPredictionResponseOrArray> {
  const baseUrl = getModelApiBaseUrl();
  if (!baseUrl) {
    throw new ModelInferenceError(
      'MODEL_PIPELINE_API_URL is required outside development.',
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
      'Unable to reach the stage 1 pipeline service. Verify car-parts-detector is running on port 8000.'
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

  const parsed = parseModelPredictionPayload(payload);
  return parsed;
}

export async function inferDamageFromModelApiAllDetections(
  file: File
): Promise<ModelPredictionResponse[]> {
  const result = await inferDamageFromModelApi(file);

  if (!Array.isArray(result) || result.length === 0) {
    throw new ModelInferenceError(
      'Stage 1 must return per-detection stage 2 classifications for estimate flow.'
    );
  }

  return result;
}
