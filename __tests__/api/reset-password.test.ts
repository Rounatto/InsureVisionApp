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

vi.mock("bcrypt", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("new_hashed_password"),
  },
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
    mockFindFirst.mockResolvedValue(null);

    const res = await POST(buildRequest(validBody));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/invalid|expired/i);
  });

  it("returns 400 for expired token", async () => {
    mockFindFirst.mockResolvedValue({
      identifier: "user@test.com",
      token: "valid-token-123",
      expires: new Date(Date.now() - 3600_000), // 1 hour ago
    });
    mockDelete.mockResolvedValue({});

    const res = await POST(buildRequest(validBody));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/expired/i);
  });

  it("returns 400 when user not found", async () => {
    mockFindFirst.mockResolvedValue({
      identifier: "ghost@test.com",
      token: "valid-token-123",
      expires: new Date(Date.now() + 3600_000),
    });
    mockFindUnique.mockResolvedValue(null);

    const res = await POST(buildRequest(validBody));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/user not found/i);
  });

  it("resets password and deletes token on success", async () => {
    mockFindFirst.mockResolvedValue({
      identifier: "user@test.com",
      token: "valid-token-123",
      expires: new Date(Date.now() + 3600_000),
    });
    mockFindUnique.mockResolvedValue({ id: "u1", email: "user@test.com" });
    mockUpdate.mockResolvedValue({});
    mockDelete.mockResolvedValue({});

    const res = await POST(buildRequest(validBody));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.message).toMatch(/reset successfully/i);

    // Password was hashed and saved
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { password: "new_hashed_password" },
      })
    );

    // Token was deleted
    expect(mockDelete).toHaveBeenCalled();
  });
});
