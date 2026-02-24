import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ────────────────────────────────────────────────────
const mockAuth = vi.fn();
const mockEstimateCount = vi.fn();
const mockEstimateFindMany = vi.fn();

vi.mock("@/config/auth", () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
}));

vi.mock("@/config/db", () => ({
  db: {
    estimate: {
      count: (...args: unknown[]) => mockEstimateCount(...args),
      findMany: (...args: unknown[]) => mockEstimateFindMany(...args),
    },
  },
}));

// ── Helpers ──────────────────────────────────────────────────
function buildRequest(): Request {
  return new Request("http://localhost:3000/api/auth/stats", { method: "GET" });
}

// ── Tests ────────────────────────────────────────────────────
describe("GET /api/auth/stats", () => {
  let GET: () => Promise<Response>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/app/api/auth/stats/route");
    GET = mod.GET;
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns correct stats for authenticated user", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1" } });
    mockEstimateCount.mockResolvedValue(3);
    mockEstimateFindMany.mockResolvedValue([
      { photos: ["a.jpg", "b.jpg"] },
      { photos: ["c.jpg"] },
      { photos: [] },
    ]);

    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.estimates).toBe(3);
    expect(data.photos).toBe(3); // 2 + 1 + 0
  });

  it("returns 0s when user has no estimates", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1" } });
    mockEstimateCount.mockResolvedValue(0);
    mockEstimateFindMany.mockResolvedValue([]);

    const res = await GET();
    const data = await res.json();
    expect(data.estimates).toBe(0);
    expect(data.photos).toBe(0);
  });
});
