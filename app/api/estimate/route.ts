import { NextResponse } from "next/server";
import { getSupabaseAdmin, hasSupabaseAdminEnv } from "@/config/supabase";
import crypto from "crypto";
import { requireDb, requireAuth, requireTrustedOrigin, requireRateLimit, db } from "@/lib/api-helpers";
import { RL_ESTIMATE } from "@/lib/constants";
import type { ErrorResponse } from "@/types/auth";

const BUCKET = "damage-photos";
const ALLOWED_TYPES = ["image/png", "image/jpeg"];
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

/**
 * POST /api/estimate
 *
 * Accepts multipart FormData with "photos".
 * Uploads each photo to Supabase Storage, then returns a MOCK estimate.
 *
 * TODO: Replace mock result with real AI model output.
 */
export async function POST(req: Request) {
  try {
    const originError = requireTrustedOrigin(req);
    if (originError) return originError;

    const dbError = requireDb();
    if (dbError) return dbError;

    const { session, error: authError } = await requireAuth();
    if (authError) return authError;

    const rlError = requireRateLimit(req, `estimate:${session.user.id}`, RL_ESTIMATE);
    if (rlError) return rlError;

    // Parse form data
    const formData = await req.formData();
    const photos = formData.getAll("photos") as File[];

    if (!photos.length) {
      return NextResponse.json<ErrorResponse>(
        { success: false, message: "At least one photo is required." },
        { status: 400 }
      );
    }

    if (photos.length > 8) {
      return NextResponse.json<ErrorResponse>(
        { success: false, message: "Maximum 8 photos allowed." },
        { status: 400 }
      );
    }

    // Validate each file
    for (const photo of photos) {
      if (!ALLOWED_TYPES.includes(photo.type)) {
        return NextResponse.json<ErrorResponse>(
          { success: false, message: `Invalid file type: ${photo.name}. Only PNG and JPG are accepted.` },
          { status: 400 }
        );
      }
      if (photo.size > MAX_SIZE) {
        return NextResponse.json<ErrorResponse>(
          { success: false, message: `File too large: ${photo.name}. Maximum size is 10MB.` },
          { status: 400 }
        );
      }
    }

    // Generate a unique estimate ID
    const estimateId = `EST-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const userId = session.user.id;

    const uploadedUrls: string[] = [];
    const canUploadToSupabase = hasSupabaseAdminEnv();
    const supabase = canUploadToSupabase ? getSupabaseAdmin() : null;

    if (!supabase) {
      console.warn(
        "Estimate: Supabase env vars are missing. Skipping photo upload and continuing with estimate.",
      );
    }

    if (supabase) {
      for (const photo of photos) {
        const ext = photo.name.split(".").pop() || "jpg";
        const fileName = `${crypto.randomUUID()}.${ext}`;
        const storagePath = `${userId}/${estimateId}/${fileName}`;

        const buffer = Buffer.from(await photo.arrayBuffer());

        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(storagePath, buffer, {
            contentType: photo.type,
            upsert: false,
          });

        if (uploadError) {
          console.error("Supabase upload error:", uploadError);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from(BUCKET)
          .getPublicUrl(storagePath);

        uploadedUrls.push(urlData.publicUrl);
      }
    }

    // ────────────────────────────────────────────────────────────
    // AI_MODEL_CALL: Replace the mock below with the real model.
    //
    // Photos are now stored in Supabase Storage.
    // Pass `uploadedUrls` to the model for analysis.
    // ────────────────────────────────────────────────────────────

    // Mock estimation result
    const mockParts = [
      { name: "Front Bumper", cost: 450, severity: "High" },
      { name: "Hood", cost: 800, severity: "Medium" },
      { name: "Left Headlight", cost: 320, severity: "High" },
      { name: "Front Grille", cost: 180, severity: "Low" },
      { name: "Paint Work", cost: 600, severity: "Medium" },
    ];

    // Randomly include 3–5 parts for variety
    const count = 3 + Math.floor(Math.random() * 3);
    const selectedParts = mockParts
      .sort(() => Math.random() - 0.5)
      .slice(0, count);

    const totalCost = selectedParts.reduce((sum, p) => sum + p.cost, 0);

    const result = {
      id: estimateId,
      totalCost,
      parts: selectedParts,
      photos: uploadedUrls,
      summary: `Based on ${photos.length} uploaded photo${photos.length > 1 ? "s" : ""}, we detected damage to ${count} component${count > 1 ? "s" : ""}. This is a preliminary estimate — final costs may vary after physical inspection.`,
    };

    // Persist estimate to database
    await db.estimate.create({
      data: {
        id: estimateId,
        userId,
        summary: result.summary,
        totalCost,
        photos: uploadedUrls,
        parts: {
          create: selectedParts.map((p) => ({
            name: p.name,
            cost: p.cost,
            severity: p.severity,
          })),
        },
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Estimate error:", error);
    return NextResponse.json<ErrorResponse>(
      { success: false, message: "Failed to process estimation. Please try again." },
      { status: 500 }
    );
  }
}
