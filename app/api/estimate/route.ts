import { NextResponse } from "next/server";
import { auth } from "@/config/auth";
import crypto from "crypto";

/**
 * POST /api/estimate
 *
 * Accepts multipart form data with "photos" field.
 * Currently returns a MOCK estimation result.
 *
 * TODO: Replace with real AI model call once the team's
 * custom model is deployed. The expected integration point
 * is marked below with "AI_MODEL_CALL".
 */
export async function POST(req: Request) {
  try {
    // Auth check
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse form data
    const formData = await req.formData();
    const photos = formData.getAll("photos") as File[];

    if (!photos.length) {
      return NextResponse.json(
        { error: "At least one photo is required." },
        { status: 400 }
      );
    }

    if (photos.length > 8) {
      return NextResponse.json(
        { error: "Maximum 8 photos allowed." },
        { status: 400 }
      );
    }

    // Validate each file
    const allowedTypes = ["image/png", "image/jpeg"];
    const maxSize = 10 * 1024 * 1024; // 10MB

    for (const photo of photos) {
      if (!allowedTypes.includes(photo.type)) {
        return NextResponse.json(
          { error: `Invalid file type: ${photo.name}. Only PNG and JPG are accepted.` },
          { status: 400 }
        );
      }
      if (photo.size > maxSize) {
        return NextResponse.json(
          { error: `File too large: ${photo.name}. Maximum size is 10MB.` },
          { status: 400 }
        );
      }
    }

    // ────────────────────────────────────────────────────────────
    // AI_MODEL_CALL: Replace the mock below with the real model.
    //
    // Expected input:  photos (File[])
    // Expected output: { parts: [...], totalCost, summary }
    // ────────────────────────────────────────────────────────────

    // Simulate processing delay (1–2s)
    await new Promise((r) => setTimeout(r, 1200 + Math.random() * 800));

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
      summary: `Based on ${photos.length} uploaded photo${photos.length > 1 ? "s" : ""}, we detected damage to ${count} component${count > 1 ? "s" : ""}. This is a preliminary estimate — final costs may vary after physical inspection.`,
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
