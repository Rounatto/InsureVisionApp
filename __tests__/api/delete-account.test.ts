import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ────────────────────────────────────────────────────
const mockAuth = vi.fn();
const mockDelete = vi.fn();

vi.mock("@/config/auth", () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
}));

vi.mock("@/config/db", () => ({
  db: {
    user: {
      delete: (...args: unknown[]) => mockDelete(...args),
    },
  },
}));

// ── Tests ────────────────────────────────────────────────────
describe("DELETE /api/auth/delete-account", () => {
  let DELETE: () => Promise<Response>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/app/api/auth/delete-account/route");
    DELETE = mod.DELETE;
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await DELETE();
    expect(res.status).toBe(401);
  });

  it("deletes the user and returns success", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1" } });
    mockDelete.mockResolvedValue({});

    const res = await DELETE();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);

    expect(mockDelete).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "u1" } })
    );
  });
});
