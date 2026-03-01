import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ────────────────────────────────────────────────────
const mockAuth = vi.fn();
const mockFindUnique = vi.fn();
const mockDelete = vi.fn();
const mockDeleteManyTokens = vi.fn();
const mockTransaction = vi.fn();

vi.mock("@/config/auth", () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
}));

vi.mock("@/config/db", () => ({
  db: {
    user: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      delete: (...args: unknown[]) => mockDelete(...args),
    },
    securityToken: {
      deleteMany: (...args: unknown[]) => mockDeleteManyTokens(...args),
    },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
  isDatabaseConfigured: true,
}));

vi.mock("bcrypt", () => ({
  default: {
    compare: vi.fn(),
  },
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn().mockReturnValue({ ok: true, remaining: 5, retryAfterMs: 0 }),
  rateLimitResponse: vi.fn(),
  getClientIp: vi.fn().mockReturnValue("127.0.0.1"),
}));

vi.mock("@/lib/security", () => ({
  ensureTrustedOrigin: vi.fn().mockReturnValue(null),
}));

vi.mock("@/lib/audit", () => ({
  logAudit: vi.fn(),
}));

// ── Helpers ──────────────────────────────────────────────────
function buildRequest(body?: unknown): Request {
  return new Request("http://localhost:3000/api/auth/delete-account", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

// ── Tests ────────────────────────────────────────────────────
describe("DELETE /api/auth/delete-account", () => {
  let DELETE: (req: Request) => Promise<Response>;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockTransaction.mockImplementation(async (ops: Promise<unknown>[]) =>
      Promise.all(ops)
    );
    const mod = await import("@/app/api/auth/delete-account/route");
    DELETE = mod.DELETE;
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await DELETE(buildRequest());
    expect(res.status).toBe(401);
  });

  it("requires password confirmation for credential accounts", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1" } });
    mockFindUnique.mockResolvedValue({ password: "hashed_pw", email: "u@t.com" });

    const res = await DELETE(buildRequest()); // no body
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.message).toMatch(/password/i);
  });

  it("returns 400 when password is incorrect", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1" } });
    mockFindUnique.mockResolvedValue({ password: "hashed_pw", email: "u@t.com" });

    const bcrypt = await import("bcrypt");
    (bcrypt.default.compare as ReturnType<typeof vi.fn>).mockResolvedValue(false);

    const res = await DELETE(buildRequest({ password: "wrong" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.message).toMatch(/incorrect/i);
  });

  it("deletes the user atomically on correct password", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1" } });
    mockFindUnique.mockResolvedValue({ password: "hashed_pw", email: "u@t.com" });
    mockDeleteManyTokens.mockResolvedValue({});
    mockDelete.mockResolvedValue({});

    const bcrypt = await import("bcrypt");
    (bcrypt.default.compare as ReturnType<typeof vi.fn>).mockResolvedValue(true);

    const res = await DELETE(buildRequest({ password: "correct" }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(mockTransaction).toHaveBeenCalled();
  });

  it("deletes OAuth-only account without password", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1" } });
    mockFindUnique.mockResolvedValue({ password: null, email: "u@t.com" });
    mockDeleteManyTokens.mockResolvedValue({});
    mockDelete.mockResolvedValue({});

    const res = await DELETE(buildRequest());
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(mockTransaction).toHaveBeenCalled();
  });
});
