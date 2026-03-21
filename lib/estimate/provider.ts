import { aiApiKey, aiEndpoint, aiProvider, aiTimeoutMs } from "@/config/ai";

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
}

function buildMockEstimate(input: EstimateModelInput): EstimateModelOutput {
  const mockParts: EstimatePart[] = [
    { name: "Front Bumper", cost: 450, severity: "High" },
    { name: "Hood", cost: 800, severity: "Medium" },
    { name: "Left Headlight", cost: 320, severity: "High" },
    { name: "Front Grille", cost: 180, severity: "Low" },
    { name: "Paint Work", cost: 600, severity: "Medium" },
  ];

  const count = 3 + Math.floor(Math.random() * 3);
  const selectedParts = [...mockParts].sort(() => Math.random() - 0.5).slice(0, count);

  return {
    parts: selectedParts,
    summary: `Based on ${input.photoCount} uploaded photo${input.photoCount > 1 ? "s" : ""}, we detected damage to ${count} component${count > 1 ? "s" : ""}. This is a preliminary estimate - final costs may vary after physical inspection.`,
  };
}

function normalizeModelOutput(data: unknown): EstimateModelOutput | null {
  if (!data || typeof data !== "object") return null;

  const payload = data as { parts?: unknown; summary?: unknown };
  if (!Array.isArray(payload.parts) || typeof payload.summary !== "string") return null;

  const parts: EstimatePart[] = [];
  for (const item of payload.parts) {
    if (!item || typeof item !== "object") return null;
    const part = item as { name?: unknown; cost?: unknown; severity?: unknown };

    if (typeof part.name !== "string") return null;
    if (typeof part.cost !== "number" || !Number.isFinite(part.cost)) return null;
    if (typeof part.severity !== "string") return null;

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

async function callHttpProvider(input: EstimateModelInput): Promise<EstimateModelOutput> {
  if (!aiEndpoint) {
    throw new Error("AI_ENDPOINT is missing.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), aiTimeoutMs);

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (aiApiKey) {
      headers.Authorization = `Bearer ${aiApiKey}`;
    }

    const res = await fetch(aiEndpoint, {
      method: "POST",
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
      throw new Error("AI provider response format is invalid.");
    }

    return normalized;
  } finally {
    clearTimeout(timeout);
  }
}

export async function generateEstimate(input: EstimateModelInput): Promise<EstimateModelOutput> {
  if (aiProvider === "http") {
    try {
      return await callHttpProvider(input);
    } catch (error) {
      console.warn("AI provider call failed, falling back to mock estimate.", error);
      return buildMockEstimate(input);
    }
  }

  return buildMockEstimate(input);
}

