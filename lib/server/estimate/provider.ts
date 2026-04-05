import { inferDamageFromModelApiAllDetections, getModelApiBaseUrl } from '@/lib/server/model-inference';

export interface EstimatePrediction {
  photoUrl: string;
  prediction: string;
  confidence: number;
  probabilities: Record<string, number>;
}

export interface EstimateModelInput {
  jobId: string;
  userId: string;
  photoUrls: string[];
  photoCount: number;
}

export interface EstimateModelOutput {
  predictions: EstimatePrediction[];
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

function hasLocalModelInferenceProvider(): boolean {
  return Boolean(getModelApiBaseUrl());
}

async function fetchPhotoAsFile(photoUrl: string, photoIndex: number): Promise<File> {
  const res = await fetch(photoUrl, { cache: 'no-store' });

  if (!res.ok) {
    throw new Error(`Failed to fetch uploaded photo ${photoIndex} (status ${res.status}).`);
  }

  const blob = await res.blob();
  const contentType = blob.type || 'image/jpeg';
  const extension = contentType.includes('png') ? 'png' : 'jpg';

  return new File([blob], `estimate-photo-${photoIndex}.${extension}`, {
    type: contentType,
  });
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
      for (const prediction of allPredictions) {
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
      errors[0] ||
        'Stage 1 pipeline could not analyze any uploaded photos.'
    );
  }

  return {
    predictions,
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
