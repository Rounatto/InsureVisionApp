import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ────────────────────────────────────────────────────
const mockFindFirstToken = vi.fn();
const mockDeleteToken = vi.fn();
const mockDeleteManyTokens = vi.fn();
const mockFindUnique = vi.fn();
const mockUpdate = vi.fn();
const mockTransaction = vi.fn();

vi.mock("@/config/db", () => ({
  db: {
    securityToken: {
      findFirst: (...args: unknown[]) => mockFindFirstToken(...args),
      delete: (...args: unknown[]) => mockDeleteToken(...args),
      deleteMany: (...args: unknown[]) => mockDeleteManyTokens(...args),
    },
    user: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
    },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
  isDatabaseConfigured: true,
}));

vi.mock("@/config/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("bcrypt", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("new_hashed_password"),
  },
}));

vi.mock("@/lib/tokens", () => ({
  hashToken: vi.fn().mockImplementation((t: string) => `hashed_${t}`),
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
  return new Request("http://localhost:3000/api/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validBody = {
  token: "valid-token-123",
  password: "NewSecure1",
  confirmPassword: "NewSecure1",
};

// ── Tests ────────────────────────────────────────────────────
describe("POST /api/auth/reset-password", () => {
  let POST: (req: Request) => Promise<Response>;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockTransaction.mockImplementation(async (ops: Promise<unknown>[]) =>
      Promise.all(ops)
    );
    const mod = await import("@/app/api/auth/reset-password/route");
    POST = mod.POST;
  });

  it("returns 400 for invalid input (weak password)", async () => {
    const res = await POST(
      buildRequest({ token: "t", password: "weak", confirmPassword: "weak" })
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid token", async () => {
    mockFindFirstToken.mockResolvedValue(null);

    const res = await POST(buildRequest(validBody));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.message).toMatch(/invalid|expired/i);
  });

  it("returns 400 for expired token", async () => {
    mockFindFirstToken.mockResolvedValue({
      id: "tok1",
      type: "PASSWORD_RESET",
      hashedToken: "hashed_valid-token-123",
      identifier: "user@test.com",
      expires: new Date(Date.now() - 3600_000),
    });
    mockDeleteToken.mockResolvedValue({});

    const res = await POST(buildRequest(validBody));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.message).toMatch(/invalid|expired/i);
  });

  it("returns generic error when user not found", async () => {
    mockFindFirstToken.mockResolvedValue({
      id: "tok1",
      type: "PASSWORD_RESET",
      hashedToken: "hashed_valid-token-123",
      identifier: "ghost@test.com",
      expires: new Date(Date.now() + 3600_000),
    });
    mockFindUnique.mockResolvedValue(null);

    const res = await POST(buildRequest(validBody));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.message).toMatch(/invalid/i);
  });

  it("resets password atomically and deletes token on success", async () => {
    mockFindFirstToken.mockResolvedValue({
      id: "tok1",
      type: "PASSWORD_RESET",
      hashedToken: "hashed_valid-token-123",
      identifier: "user@test.com",
      expires: new Date(Date.now() + 3600_000),
    });
    mockFindUnique.mockResolvedValue({ id: "u1", email: "user@test.com" });
    mockUpdate.mockResolvedValue({});
    mockDeleteManyTokens.mockResolvedValue({});

    const res = await POST(buildRequest(validBody));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.message).toMatch(/password updated/i);

    // Transaction was invoked (password update + tokenVersion bump + token delete)
    expect(mockTransaction).toHaveBeenCalled();
  });
});
