import { describe, it, expect, vi, beforeEach } from "vitest";

/*
 * We test the register route handler by mocking its external deps:
 *   - @/config/db   → mock Prisma client (with $transaction)
 *   - bcrypt         → mock hashing
 *   - @/lib/tokens   → mock secure token generation
 *   - @/lib/rate-limit → allow all requests
 *   - @/lib/audit    → no-op
 *
 * The route itself is imported dynamically per test so mocks are fresh.
 */

// ── Mocks ────────────────────────────────────────────────────
const mockFindUnique = vi.fn();
const mockCreate = vi.fn();
const mockCreateToken = vi.fn();
const mockTransaction = vi.fn();

vi.mock("@/config/db", () => ({
  db: {
    user: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      create: (...args: unknown[]) => mockCreate(...args),
    },
    securityToken: {
      create: (...args: unknown[]) => mockCreateToken(...args),
    },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}));

vi.mock("bcrypt", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("hashed_password"),
  },
}));

vi.mock("@/lib/email", () => ({
  sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/tokens", () => ({
  generateSecureToken: vi.fn().mockReturnValue({
    raw: "raw-token-abc",
    hashed: "hashed-token-abc",
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
  return new Request("http://localhost:3000/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validBody = {
  name: "John Doe",
  email: "john@example.com",
  password: "SecurePass1",
  confirmPassword: "SecurePass1",
};

// ── Tests ────────────────────────────────────────────────────
describe("POST /api/auth/register", () => {
  let POST: (req: Request) => Promise<Response>;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Default: $transaction executes the callback with a fake tx
    mockTransaction.mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        user: { create: (...args: unknown[]) => mockCreate(...args) },
        securityToken: { create: (...args: unknown[]) => mockCreateToken(...args) },
      };
      return cb(tx);
    });
    const mod = await import("@/app/api/auth/register/route");
    POST = mod.POST;
  });

  it("returns 400 when body is invalid", async () => {
    const res = await POST(buildRequest({ name: "", email: "bad", password: "x", confirmPassword: "y" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.errors).toBeDefined();
  });

  it("returns 409 when user already exists", async () => {
    mockFindUnique.mockResolvedValue({ id: "1", email: "john@example.com" });

    const res = await POST(buildRequest(validBody));
    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.message).toMatch(/already exists/i);
  });

  it("returns 201 and creates user on valid input", async () => {
    mockFindUnique.mockResolvedValue(null);
    mockCreate.mockResolvedValue({
      id: "new-id",
      name: "John Doe",
      email: "john@example.com",
    });
    mockCreateToken.mockResolvedValue({});

    const res = await POST(buildRequest(validBody));
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.user.email).toBe("john@example.com");
  });

  it("creates a security token inside the transaction", async () => {
    mockFindUnique.mockResolvedValue(null);
    mockCreate.mockResolvedValue({ id: "1", name: "John Doe", email: "john@example.com" });
    mockCreateToken.mockResolvedValue({});

    await POST(buildRequest(validBody));

    expect(mockCreateToken).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: "EMAIL_VERIFICATION",
          hashedToken: "hashed-token-abc",
          identifier: "john@example.com",
          expires: expect.any(Date),
        }),
      })
    );
  });

  it("sends a verification email with the raw token", async () => {
    mockFindUnique.mockResolvedValue(null);
    mockCreate.mockResolvedValue({ id: "1", name: "John Doe", email: "john@example.com" });
    mockCreateToken.mockResolvedValue({});

    await POST(buildRequest(validBody));

    const { sendVerificationEmail } = await import("@/lib/email");
    expect(sendVerificationEmail).toHaveBeenCalledWith(
      "john@example.com",
      "raw-token-abc"
    );
  });

  it("hashes the password before storing", async () => {
    mockFindUnique.mockResolvedValue(null);
    mockCreate.mockResolvedValue({ id: "1", name: "John Doe", email: "john@example.com" });
    mockCreateToken.mockResolvedValue({});

    await POST(buildRequest(validBody));

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ password: "hashed_password" }),
      })
    );
  });

  it("lowercases the email", async () => {
    mockFindUnique.mockResolvedValue(null);
    mockCreate.mockResolvedValue({ id: "1", name: "John Doe", email: "john@example.com" });
    mockCreateToken.mockResolvedValue({});

    await POST(
      buildRequest({ ...validBody, email: "JOHN@Example.COM" })
    );

    expect(mockFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: "john@example.com" } })
    );
  });
});
