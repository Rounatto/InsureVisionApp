import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ────────────────────────────────────────────────────
const mockAuth = vi.fn();
const mockFindUnique = vi.fn();

vi.mock("@/config/auth", () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
}));

vi.mock("@/config/db", () => ({
  isDatabaseConfigured: true,
  db: {
    user: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
    },
  },
}));

// ── Helpers ──────────────────────────────────────────────────
function buildRequest(): Request {
  return new Request("http://localhost/api/auth/account-capabilities");
}

// ── Tests ────────────────────────────────────────────────────
describe("GET /api/auth/account-capabilities", () => {
  let GET: () => Promise<Response>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/app/api/auth/account-capabilities/route");
    GET = mod.GET;
  });

  it("returns 401 for unauthenticated request", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await GET();
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.message).toMatch(/unauthorized/i);
  });

  it("returns canChangePassword: true for credential user", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1" } });
    mockFindUnique.mockResolvedValue({ password: "hashed_pw" });

    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.canChangePassword).toBe(true);
  });

  it("returns canChangePassword: false for OAuth-only user", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1" } });
    mockFindUnique.mockResolvedValue({ password: null });

    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.canChangePassword).toBe(false);
  });

  it("returns canChangePassword: false on DB error (fail-safe)", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1" } });
    mockFindUnique.mockRejectedValue(new Error("DB down"));

    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.canChangePassword).toBe(false);
  });
});
