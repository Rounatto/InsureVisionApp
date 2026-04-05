import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ────────────────────────────────────────────────────
const mockAuth = vi.fn();
const mockUpdate = vi.fn();

vi.mock("@/config/auth", () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
}));

vi.mock("@/config/db", () => ({
  db: {
    user: {
      update: (...args: unknown[]) => mockUpdate(...args),
    },
  },
  isDatabaseConfigured: true,
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn().mockReturnValue({ ok: true, remaining: 5, retryAfterMs: 0 }),
  rateLimitResponse: vi.fn(),
  getClientIp: vi.fn().mockReturnValue("127.0.0.1"),
}));

vi.mock("@/lib/security", () => ({
  ensureTrustedOrigin: vi.fn().mockReturnValue(null),
}));

// ── Helpers ──────────────────────────────────────────────────
function buildRequest(body: unknown): Request {
  return new Request("http://localhost:3000/api/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// ── Tests ────────────────────────────────────────────────────
describe("PATCH /api/profile", () => {
  let PATCH: (req: Request) => Promise<Response>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/app/api/profile/route");
    PATCH = mod.PATCH;
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await PATCH(buildRequest({ name: "New Name" }));
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid name (too short)", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1" } });
    const res = await PATCH(buildRequest({ name: "X" }));
    expect(res.status).toBe(400);
  });

  it("updates profile on valid input", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1" } });
    mockUpdate.mockResolvedValue({
      id: "u1",
      name: "New Name",
      email: "user@test.com",
    });

    const res = await PATCH(buildRequest({ name: "New Name" }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.user.name).toBe("New Name");
  });
});
