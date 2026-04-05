import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ────────────────────────────────────────────────────
const mockAuth = vi.fn();
const mockFindMany = vi.fn();

vi.mock("@/config/auth", () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
}));

vi.mock("@/config/db", () => ({
  isDatabaseConfigured: true,
  db: {
    estimate: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
    },
  },
}));

// ── Tests ────────────────────────────────────────────────────
describe("GET /api/estimates", () => {
  let GET: () => Promise<Response>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/app/api/estimates/route");
    GET = mod.GET;
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns estimates for authenticated user", async () => {
    const mockEstimates = [
      {
        id: "EST-123",
        userId: "u1",
        summary: "Damage report",
        totalCost: 1200,
        photos: ["a.jpg"],
        parts: [{ name: "Bumper", cost: 500, severity: "High" }],
        createdAt: new Date().toISOString(),
      },
    ];
    mockAuth.mockResolvedValue({ user: { id: "u1" } });
    mockFindMany.mockResolvedValue(mockEstimates);

    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveLength(1);
    expect(data[0].id).toBe("EST-123");
  });

  it("queries with correct userId and ordering", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1" } });
    mockFindMany.mockResolvedValue([]);

    await GET();

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "u1" },
        include: { parts: true },
        orderBy: { createdAt: "desc" },
      })
    );
  });
});
