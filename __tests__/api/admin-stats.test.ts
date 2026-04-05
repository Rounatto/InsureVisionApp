import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ────────────────────────────────────────────────────
const mockAuth = vi.fn();
const mockUserCount = vi.fn();
const mockEstimateCount = vi.fn();

vi.mock("@/config/auth", () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
}));

vi.mock("@/config/db", () => ({
  db: {
    user: { count: (...args: unknown[]) => mockUserCount(...args) },
    estimate: { count: (...args: unknown[]) => mockEstimateCount(...args) },
  },
  isDatabaseConfigured: true,
}));

vi.mock("@/lib/admin", () => ({
  isAdminEmail: vi.fn().mockImplementation((email: string) => email === "admin@test.com"),
}));

vi.mock("@/lib/audit", () => ({
  logAudit: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  getClientIp: vi.fn().mockReturnValue("127.0.0.1"),
}));

// ── Helpers ──────────────────────────────────────────────────
function buildRequest(): Request {
  return new Request("http://localhost/api/admin/stats");
}

// ── Tests ────────────────────────────────────────────────────
describe("GET /api/admin/stats", () => {
  let GET: (req: Request) => Promise<Response>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/app/api/admin/stats/route");
    GET = mod.GET;
  });

  it("returns 403 for non-admin user", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1", email: "normal@test.com" } });

    const res = await GET(buildRequest());
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.message).toMatch(/forbidden/i);
  });

  it("returns 403 for unauthenticated request", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await GET(buildRequest());
    expect(res.status).toBe(403);
  });

  it("returns stats for admin user", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1", email: "admin@test.com" } });
    mockUserCount
      .mockResolvedValueOnce(100)  // totalUsers
      .mockResolvedValueOnce(80)   // verifiedUsers
      .mockResolvedValueOnce(20)   // unverifiedUsers
      .mockResolvedValueOnce(5);   // recentSignups
    mockEstimateCount.mockResolvedValue(50);

    const res = await GET(buildRequest());
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.totalUsers).toBe(100);
    expect(data.verifiedUsers).toBe(80);
    expect(data.unverifiedUsers).toBe(20);
    expect(data.totalEstimates).toBe(50);
    expect(data.recentSignups).toBe(5);
  });
});
