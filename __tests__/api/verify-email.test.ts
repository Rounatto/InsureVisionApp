import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ────────────────────────────────────────────────────
const mockFindUnique = vi.fn();
const mockFindUniqueToken = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockTransaction = vi.fn();

vi.mock("@/config/db", () => ({
  isDatabaseConfigured: true,
  db: {
    securityToken: {
      findUnique: (...args: unknown[]) => mockFindUniqueToken(...args),
      delete: (...args: unknown[]) => mockDelete(...args),
    },
    user: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
    },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}));

vi.mock("@/config/auth", () => ({
  auth: vi.fn(),
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
function buildRequest(token?: string): Request {
  const url = token
    ? `http://localhost:3000/api/auth/verify-email?token=${token}`
    : "http://localhost:3000/api/auth/verify-email";
  return new Request(url, { method: "GET" });
}

// ── Tests ────────────────────────────────────────────────────
describe("GET /api/auth/verify-email", () => {
  let GET: (req: Request) => Promise<Response>;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Default: $transaction resolves with its array of promises
    mockTransaction.mockImplementation(async (ops: Promise<unknown>[]) =>
      Promise.all(ops)
    );
    const mod = await import("@/app/api/auth/verify-email/route");
    GET = mod.GET;
  });

  it("redirects to login with error when no token provided", async () => {
    const res = await GET(buildRequest());
    expect(res.status).toBe(307);
    const location = res.headers.get("location");
    expect(location).toContain("/login?error=invalid-link");
  });

  it("redirects to login with error for invalid token", async () => {
    mockFindUniqueToken.mockResolvedValue(null);
    const res = await GET(buildRequest("bad-token"));
    expect(res.status).toBe(307);
    const location = res.headers.get("location");
    expect(location).toContain("/login?error=invalid-link");
  });

  it("redirects with error for expired token and deletes it", async () => {
    mockFindUniqueToken.mockResolvedValue({
      id: "tok1",
      type: "EMAIL_VERIFICATION",
      hashedToken: "hashed_expired-token",
      identifier: "user@test.com",
      expires: new Date(Date.now() - 3600_000),
    });
    mockDelete.mockResolvedValue({});

    const res = await GET(buildRequest("expired-token"));
    expect(res.status).toBe(307);
    const location = res.headers.get("location");
    expect(location).toContain("/login?error=expired-link");
    expect(mockDelete).toHaveBeenCalled();
  });

  it("verifies email atomically and redirects to login", async () => {
    mockFindUniqueToken.mockResolvedValue({
      id: "tok1",
      type: "EMAIL_VERIFICATION",
      hashedToken: "hashed_valid-token",
      identifier: "user@test.com",
      expires: new Date(Date.now() + 86400_000),
    });
    mockFindUnique.mockResolvedValue({ id: "u1", email: "user@test.com" });
    mockUpdate.mockResolvedValue({});
    mockDelete.mockResolvedValue({});

    const res = await GET(buildRequest("valid-token"));
    expect(res.status).toBe(307);
    const location = res.headers.get("location");
    expect(location).toContain("/login?verified=true");

    // Transaction was called with the batched operations
    expect(mockTransaction).toHaveBeenCalled();
  });
});
