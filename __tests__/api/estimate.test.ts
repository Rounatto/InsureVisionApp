import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ────────────────────────────────────────────────────
const mockAuth = vi.fn();
const mockCreate = vi.fn();

vi.mock("@/config/auth", () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
}));

vi.mock("@/config/db", () => ({
  db: {
    estimate: {
      create: (...args: unknown[]) => mockCreate(...args),
    },
  },
  isDatabaseConfigured: true,
}));

vi.mock("@/config/supabase", () => ({
  hasSupabaseAdminEnv: vi.fn().mockReturnValue(false),
  getSupabaseAdmin: vi.fn(),
}));

vi.mock("@/lib/security", () => ({
  ensureTrustedOrigin: vi.fn().mockReturnValue(null),
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn().mockReturnValue({ ok: true, remaining: 5, retryAfterMs: 0 }),
  rateLimitResponse: vi.fn(),
  getClientIp: vi.fn().mockReturnValue("127.0.0.1"),
}));

// ── Helpers ──────────────────────────────────────────────────
function buildFormData(files: { name: string; type: string; size: number }[]) {
  const fd = new FormData();
  for (const f of files) {
    const blob = new Blob([new ArrayBuffer(f.size)], { type: f.type });
    fd.append("photos", new File([blob], f.name, { type: f.type }));
  }
  return fd;
}

function buildRequest(fd: FormData): Request {
  return new Request("http://localhost/api/estimate", { method: "POST", body: fd });
}

// ── Tests ────────────────────────────────────────────────────
describe("POST /api/estimate", () => {
  let POST: (req: Request) => Promise<Response>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/app/api/estimate/route");
    POST = mod.POST;
  });

  it("returns 401 for unauthenticated requests", async () => {
    mockAuth.mockResolvedValue(null);
    const fd = buildFormData([{ name: "a.jpg", type: "image/jpeg", size: 100 }]);

    const res = await POST(buildRequest(fd));
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.message).toMatch(/unauthorized/i);
  });

  it("returns 400 when no photos are attached", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1" } });
    const fd = new FormData();

    const res = await POST(new Request("http://localhost/api/estimate", { method: "POST", body: fd }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.message).toMatch(/photo/i);
  });

  it("returns 400 when more than 8 photos", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1" } });
    const files = Array.from({ length: 9 }, (_, i) => ({
      name: `${i}.jpg`,
      type: "image/jpeg",
      size: 100,
    }));
    const fd = buildFormData(files);

    const res = await POST(buildRequest(fd));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.message).toMatch(/maximum 8/i);
  });

  it("rejects invalid file types", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1" } });
    const fd = buildFormData([{ name: "doc.pdf", type: "application/pdf", size: 100 }]);

    const res = await POST(buildRequest(fd));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.message).toMatch(/invalid file type/i);
  });

  it("rejects oversized files (>10 MB)", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1" } });
    const fd = buildFormData([{ name: "big.jpg", type: "image/jpeg", size: 11 * 1024 * 1024 }]);

    const res = await POST(buildRequest(fd));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.message).toMatch(/too large/i);
  });

  it("creates estimate successfully (no Supabase)", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1" } });
    mockCreate.mockResolvedValue({});

    const fd = buildFormData([{ name: "car.jpg", type: "image/jpeg", size: 500 }]);

    const res = await POST(buildRequest(fd));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.id).toMatch(/^EST-/);
    expect(data.totalCost).toBeGreaterThan(0);
    expect(data.parts.length).toBeGreaterThanOrEqual(3);

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: "u1" }),
      }),
    );
  });
});
