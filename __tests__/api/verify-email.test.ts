import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ────────────────────────────────────────────────────
const mockFindFirst = vi.fn();
const mockFindUnique = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();

vi.mock("@/config/db", () => ({
  db: {
    verificationToken: {
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
      delete: (...args: unknown[]) => mockDelete(...args),
    },
    user: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
    },
  },
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
    const mod = await import("@/app/api/auth/verify-email/route");
    GET = mod.GET;
  });

  it("redirects to login with error when no token provided", async () => {
    const res = await GET(buildRequest());
    expect(res.status).toBe(307);
    const location = res.headers.get("location");
    expect(location).toContain("/login?error=missing-token");
  });

  it("redirects to login with error for invalid token", async () => {
    mockFindFirst.mockResolvedValue(null);
    const res = await GET(buildRequest("bad-token"));
    expect(res.status).toBe(307);
    const location = res.headers.get("location");
    expect(location).toContain("/login?error=invalid-token");
  });

  it("redirects with error for expired token and deletes it", async () => {
    mockFindFirst.mockResolvedValue({
      identifier: "user@test.com",
      token: "expired-token",
      expires: new Date(Date.now() - 3600_000),
    });
    mockDelete.mockResolvedValue({});

    const res = await GET(buildRequest("expired-token"));
    expect(res.status).toBe(307);
    const location = res.headers.get("location");
    expect(location).toContain("/login?error=expired-token");
    expect(mockDelete).toHaveBeenCalled();
  });

  it("verifies email, updates user, deletes token, and redirects to login", async () => {
    mockFindFirst.mockResolvedValue({
      identifier: "user@test.com",
      token: "valid-token",
      expires: new Date(Date.now() + 86400_000),
    });
    mockFindUnique.mockResolvedValue({ id: "u1", email: "user@test.com" });
    mockUpdate.mockResolvedValue({});
    mockDelete.mockResolvedValue({});

    const res = await GET(buildRequest("valid-token"));
    expect(res.status).toBe(307);
    const location = res.headers.get("location");
    expect(location).toContain("/login?verified=true");

    // emailVerified was set
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { emailVerified: expect.any(Date) },
      })
    );
    // Token was deleted
    expect(mockDelete).toHaveBeenCalled();
  });
});
