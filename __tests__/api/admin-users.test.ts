import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ── Mocks ────────────────────────────────────────────────────
const mockAuth = vi.fn();
const mockFindMany = vi.fn();
const mockCount = vi.fn();

vi.mock("@/config/auth", () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
}));

vi.mock("@/config/db", () => ({
  db: {
    user: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      count: (...args: unknown[]) => mockCount(...args),
    },
  },
  isDatabaseConfigured: true,
}));

vi.mock("@/lib/admin", () => ({
  isAdminEmail: vi.fn().mockImplementation((email: string) => email === "admin@test.com"),
}));

vi.mock("@/lib/audit", () => ({
  logAudit: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  getClientIp: vi.fn().mockReturnValue("127.0.0.1"),
}));

// ── Helpers ──────────────────────────────────────────────────
function buildRequest(params: Record<string, string> = {}): NextRequest {
  const url = new URL("http://localhost/api/admin/users");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return new NextRequest(url);
}

const mockUser = {
  id: "u1",
  name: "Alice",
  email: "alice@test.com",
  emailVerified: new Date(),
  image: null,
  createdAt: new Date(),
  accounts: [{ provider: "google" }],
  _count: { estimates: 3 },
};

// ── Tests ────────────────────────────────────────────────────
describe("GET /api/admin/users", () => {
  let GET: (req: NextRequest) => Promise<Response>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/app/api/admin/users/route");
    GET = mod.GET;
  });

  it("returns 403 for non-admin user", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u2", email: "normal@test.com" } });

    const res = await GET(buildRequest());
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.message).toMatch(/forbidden/i);
  });

  it("returns paginated user list for admin", async () => {
    mockAuth.mockResolvedValue({ user: { id: "a1", email: "admin@test.com" } });
    mockFindMany.mockResolvedValue([mockUser]);
    mockCount.mockResolvedValue(1);

    const res = await GET(buildRequest());
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.users).toHaveLength(1);
    expect(data.users[0].name).toBe("Alice");
    expect(data.users[0].authProvider).toBe("Google");
    expect(data.users[0].estimateCount).toBe(3);
    expect(data.total).toBe(1);
    expect(data.page).toBe(1);
    expect(data.pageSize).toBe(20);
  });

  it("passes search parameter to query", async () => {
    mockAuth.mockResolvedValue({ user: { id: "a1", email: "admin@test.com" } });
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    await GET(buildRequest({ search: "alice", page: "2" }));

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            expect.objectContaining({ name: expect.objectContaining({ contains: "alice" }) }),
          ]),
        }),
        skip: 20, // page 2 → skip 20
      }),
    );
  });
});
