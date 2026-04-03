import { NextResponse } from 'next/server';
import {
  inferDamageFromModelApi,
  ModelInferenceError,
} from '@/lib/server/model-inference';

const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_SIZE_BYTES = 10 * 1024 * 1024;

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, message: 'A single image file is required.' },
        { status: 400 }
      );
    }

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: 'Only PNG, JPG, or WEBP images are accepted.' },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        {
          success: false,
          message: 'Image is too large. Maximum allowed size is 10MB.',
        },
        { status: 400 }
      );
    }

    const prediction = await inferDamageFromModelApi(file);

    // Normalize to single prediction for backward compatibility
    // (for direct model/predict calls, return best prediction)
    const normalizedPrediction = Array.isArray(prediction)
      ? prediction.sort((a, b) => b.confidence - a.confidence)[0]
      : prediction;

    return NextResponse.json({
      success: true,
      ...normalizedPrediction,
    });
  } catch (error) {
    if (error instanceof ModelInferenceError) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: error.status ?? 502 }
      );
    }

    console.error('Model prediction route error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Unexpected model prediction error.',
      },
      { status: 500 }
    );
  }
}
