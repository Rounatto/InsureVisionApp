import { NextResponse } from 'next/server';
import { completeEstimateJob, failEstimateJob } from '@/lib/estimate/jobs';
import { processWebhookToOutput } from '@/lib/estimate/provider';
import { db } from '@/lib/api-helpers';

export const runtime = 'nodejs';

// Use same secret validation method
const modelApiKey = process.env.MODEL_API_KEY || '';

export async function POST(req: Request) {
  try {
    // Basic webhook secret validation if key is configured
    if (modelApiKey) {
      const secretHeader = req.headers.get('x-api-secret');
      if (secretHeader !== modelApiKey) {
        return NextResponse.json(
          { success: false, message: 'Unauthorized webhook request.' },
          { status: 401 }
        );
      }
    }

    const payload = await req.json();
    const { job_id, status, error, predictions } = payload as {
      job_id?: string;
      status?: 'success' | 'error';
      error?: string;
      predictions?: Array<{
        photo_url: string;
        top_label: string | null;
        confidence: number | null;
        is_damaged: boolean;
        scores?: unknown;
      }>;
    };

    if (!job_id) {
      return NextResponse.json(
        { success: false, message: 'Missing job_id' },
        { status: 400 }
      );
    }

    if (status === 'error') {
      await failEstimateJob(job_id, new Error(error || 'Model server returned an error.'));
      return NextResponse.json({ success: true, message: 'Error logged.' });
    }

    if (!Array.isArray(predictions)) {
      return NextResponse.json(
        { success: false, message: 'Missing or invalid predictions array' },
        { status: 400 }
      );
    }

    // Load job from DB to get original ordered photoUrls
    const job = await db.estimateJob.findUnique({
      where: { id: job_id },
      select: { photoUrls: true, status: true },
    });

    if (!job) {
      return NextResponse.json(
        { success: false, message: 'Job not found.' },
        { status: 404 }
      );
    }

    if (job.status !== 'PROCESSING') {
      return NextResponse.json(
        { success: false, message: 'Job is not in PROCESSING state.' },
        { status: 400 } // Or 200, to prevent retries.
      );
    }

    const output = processWebhookToOutput(job.photoUrls, predictions);
    await completeEstimateJob(job_id, output);

    return NextResponse.json({ success: true, message: 'Callback processed successfully.' });
  } catch (err) {
    console.error('Webhook processing error:', err);
    return NextResponse.json(
      { success: false, message: 'Internal server error processing webhook.' },
      { status: 500 }
    );
  }
}
