import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ────────────────────────────────────────────────────
const mockAuth = vi.fn();
const mockFindUnique = vi.fn();
const mockUpdate = vi.fn();

vi.mock("@/config/auth", () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
}));

vi.mock("@/config/db", () => ({
  db: {
    user: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
    },
  },
}));

vi.mock("bcrypt", () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn().mockResolvedValue("new_hashed"),
  },
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
  return new Request("http://localhost:3000/api/auth/change-password", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validBody = {
  currentPassword: "OldPass1",
  newPassword: "NewSecure1",
  confirmPassword: "NewSecure1",
};

// ── Tests ────────────────────────────────────────────────────
describe("PATCH /api/auth/change-password", () => {
  let PATCH: (req: Request) => Promise<Response>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/app/api/auth/change-password/route");
    PATCH = mod.PATCH;
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await PATCH(buildRequest(validBody));
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid input (weak new password)", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1" } });
    const res = await PATCH(
      buildRequest({ currentPassword: "a", newPassword: "weak", confirmPassword: "weak" })
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 for Google-only account (no password)", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1" } });
    mockFindUnique.mockResolvedValue({ password: null });

    const res = await PATCH(buildRequest(validBody));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/google/i);
  });

  it("returns 400 when current password is wrong", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1" } });
    mockFindUnique.mockResolvedValue({ password: "hashed_old" });

    const bcrypt = await import("bcrypt");
    (bcrypt.default.compare as ReturnType<typeof vi.fn>).mockResolvedValue(false);

    const res = await PATCH(buildRequest(validBody));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/incorrect/i);
  });

  it("changes password and bumps tokenVersion on valid input", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1" } });
    mockFindUnique.mockResolvedValue({ password: "hashed_old" });
    mockUpdate.mockResolvedValue({});

    const bcrypt = await import("bcrypt");
    (bcrypt.default.compare as ReturnType<typeof vi.fn>).mockResolvedValue(true);

    const res = await PATCH(buildRequest(validBody));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          password: "new_hashed",
          tokenVersion: { increment: 1 },
        }),
      })
    );
  });
});
