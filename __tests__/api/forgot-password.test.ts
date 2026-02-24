import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ────────────────────────────────────────────────────
const mockFindUnique = vi.fn();
const mockDeleteMany = vi.fn();
const mockCreateToken = vi.fn();

vi.mock("@/config/db", () => ({
  db: {
    user: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
    },
    verificationToken: {
      deleteMany: (...args: unknown[]) => mockDeleteMany(...args),
      create: (...args: unknown[]) => mockCreateToken(...args),
    },
  },
}));

vi.mock("@/lib/email", () => ({
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
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

  it("creates a token when user exists", async () => {
    mockFindUnique.mockResolvedValue({ id: "1", email: "user@test.com" });
    mockDeleteMany.mockResolvedValue({ count: 0 });
    mockCreateToken.mockResolvedValue({});

    const res = await POST(buildRequest({ email: "user@test.com" }));
    expect(res.status).toBe(200);

    expect(mockDeleteMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { identifier: "user@test.com" } })
    );
    expect(mockCreateToken).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          identifier: "user@test.com",
          token: expect.any(String),
          expires: expect.any(Date),
        }),
      })
    );
  });
});
