import { NextResponse } from "next/server";
import { auth } from "@/config/auth";
import crypto from "crypto";

/**
 * POST /api/estimate
 *
 * Currently accepts JSON with { photoCount } and returns a MOCK result.
 * Photos are validated client-side only during mock mode.
 *
 * TODO (when model is ready):
 * 1. Switch back to multipart FormData with actual photo files.
 * 2. Upload photos to Supabase Storage (not server FS — Vercel is ephemeral).
 * 3. Pass Supabase Storage URLs to the AI model for analysis.
 * 4. Replace mock result with real model output.
 */
export async function POST(req: Request) {
  try {
    // Auth check
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const photoCount = body.photoCount;

    if (!photoCount || typeof photoCount !== "number" || photoCount < 1) {
      return NextResponse.json(
        { error: "At least one photo is required." },
        { status: 400 }
      );
    }

    if (photoCount > 8) {
      return NextResponse.json(
        { error: "Maximum 8 photos allowed." },
        { status: 400 }
      );
    }

    // ────────────────────────────────────────────────────────────
    // AI_MODEL_CALL: Replace the mock below with the real model.
    //
    // When the model is ready:
    //   1. Accept FormData with photos instead of JSON.
    //   2. Upload each photo to Supabase Storage:
    //        const { data } = await supabase.storage
    //          .from('damage-photos')
    //          .upload(`${userId}/${estimateId}/${file.name}`, file);
    //   3. Pass the public URLs to the model.
    //   4. Return real analysis result.
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
      id: `EST-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      totalCost,
      parts: selectedParts,
      summary: `Based on ${photoCount} uploaded photo${photoCount > 1 ? "s" : ""}, we detected damage to ${count} component${count > 1 ? "s" : ""}. This is a preliminary estimate — final costs may vary after physical inspection.`,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Estimate error:", error);
    return NextResponse.json(
      { error: "Failed to process estimation. Please try again." },
      { status: 500 }
    );
  }
}
