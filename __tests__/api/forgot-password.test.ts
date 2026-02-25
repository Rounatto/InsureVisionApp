import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ────────────────────────────────────────────────────
const mockFindUnique = vi.fn();
const mockDeleteMany = vi.fn();
const mockCreateToken = vi.fn();
const mockTransaction = vi.fn();

vi.mock("@/config/db", () => ({
  db: {
    user: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
    },
    securityToken: {
      deleteMany: (...args: unknown[]) => mockDeleteMany(...args),
      create: (...args: unknown[]) => mockCreateToken(...args),
    },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}));

vi.mock("@/lib/email", () => ({
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/tokens", () => ({
  generateSecureToken: vi.fn().mockReturnValue({
    raw: "raw-reset-token",
    hashed: "hashed-reset-token",
  }),
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn().mockReturnValue({ ok: true, remaining: 5, retryAfterMs: 0 }),
  rateLimitResponse: vi.fn(),
  getClientIp: vi.fn().mockReturnValue("127.0.0.1"),
}));

vi.mock("@/lib/audit", () => ({
  logAudit: vi.fn(),
}));

// ── Helpers ──────────────────────────────────────────────────
function buildRequest(body: unknown): Request {
  return new Request("http://localhost:3000/api/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// ── Tests ────────────────────────────────────────────────────
describe("POST /api/auth/forgot-password", () => {
  let POST: (req: Request) => Promise<Response>;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockTransaction.mockImplementation(async (ops: Promise<unknown>[]) =>
      Promise.all(ops)
    );
    const mod = await import("@/app/api/auth/forgot-password/route");
    POST = mod.POST;
  });

  it("returns 400 for invalid email", async () => {
    const res = await POST(buildRequest({ email: "not-an-email" }));
    expect(res.status).toBe(400);
  });

  it("returns success even when user doesn't exist (no enumeration)", async () => {
    mockFindUnique.mockResolvedValue(null);
    const res = await POST(buildRequest({ email: "nobody@test.com" }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.message).toMatch(/reset link/i);
  });

  it("creates a hashed token when user exists", async () => {
    mockFindUnique.mockResolvedValue({ id: "1", email: "user@test.com" });
    mockDeleteMany.mockResolvedValue({ count: 0 });
    mockCreateToken.mockResolvedValue({});

    const res = await POST(buildRequest({ email: "user@test.com" }));
    expect(res.status).toBe(200);

    // Transaction was called (atomic delete + create)
    expect(mockTransaction).toHaveBeenCalled();
  });

  it("sends reset email with the raw token", async () => {
    mockFindUnique.mockResolvedValue({ id: "1", email: "user@test.com" });
    mockDeleteMany.mockResolvedValue({ count: 0 });
    mockCreateToken.mockResolvedValue({});

    await POST(buildRequest({ email: "user@test.com" }));

    const { sendPasswordResetEmail } = await import("@/lib/email");
    expect(sendPasswordResetEmail).toHaveBeenCalledWith(
      "user@test.com",
      "raw-reset-token"
    );
  });
});
