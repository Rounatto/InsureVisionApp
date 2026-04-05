import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ────────────────────────────────────────────────────
const mockAuth = vi.fn();
const mockUpdate = vi.fn();

vi.mock("@/config/auth", () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
}));

vi.mock("@/config/db", () => ({
  db: {
    user: {
      update: (...args: unknown[]) => mockUpdate(...args),
    },
  },
  isDatabaseConfigured: true,
}));

const mockUpload = vi.fn();
const mockGetPublicUrl = vi.fn();

vi.mock("@/config/supabase", () => ({
  hasSupabaseAdminEnv: vi.fn().mockReturnValue(true),
  getSupabaseAdmin: vi.fn().mockReturnValue({
    storage: {
      from: () => ({
        upload: (...args: unknown[]) => mockUpload(...args),
        getPublicUrl: (...args: unknown[]) => mockGetPublicUrl(...args),
      }),
      createBucket: vi.fn(),
    },
  }),
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
function buildFormData(file?: { name: string; type: string; size: number }) {
  const fd = new FormData();
  if (file) {
    const blob = new Blob([new ArrayBuffer(file.size)], { type: file.type });
    fd.append("avatar", new File([blob], file.name, { type: file.type }));
  }
  return fd;
}

function buildRequest(fd: FormData): Request {
  return new Request("http://localhost/api/profile/avatar", { method: "POST", body: fd });
}

// ── Tests ────────────────────────────────────────────────────
describe("POST /api/profile/avatar", () => {
  let POST: (req: Request) => Promise<Response>;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockUpload.mockResolvedValue({ error: null });
    mockGetPublicUrl.mockReturnValue({ data: { publicUrl: "https://cdn.example.com/avatar.jpg" } });
    mockUpdate.mockResolvedValue({ id: "u1", name: "Test", email: "u@t.com", image: "https://cdn.example.com/avatar.jpg" });

    const mod = await import("@/app/api/profile/avatar/route");
    POST = mod.POST;
  });

  it("returns 401 for unauthenticated requests", async () => {
    mockAuth.mockResolvedValue(null);
    const fd = buildFormData({ name: "a.jpg", type: "image/jpeg", size: 100 });

    const res = await POST(buildRequest(fd));
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.message).toMatch(/unauthorized/i);
  });

  it("returns 400 when no file is provided", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1" } });
    const fd = new FormData();

    const res = await POST(buildRequest(fd));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.message).toMatch(/avatar file/i);
  });

  it("rejects invalid file types", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1" } });
    const fd = buildFormData({ name: "doc.pdf", type: "application/pdf", size: 100 });

    const res = await POST(buildRequest(fd));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.message).toMatch(/invalid file type/i);
  });

  it("rejects oversized files (>5 MB)", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1" } });
    const fd = buildFormData({ name: "big.jpg", type: "image/jpeg", size: 6 * 1024 * 1024 });

    const res = await POST(buildRequest(fd));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.message).toMatch(/5MB/i);
  });

  it("uploads avatar and updates user", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1" } });
    const fd = buildFormData({ name: "face.png", type: "image/png", size: 500 });

    const res = await POST(buildRequest(fd));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.user.image).toBe("https://cdn.example.com/avatar.jpg");

    expect(mockUpload).toHaveBeenCalled();
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "u1" },
        data: expect.objectContaining({ image: "https://cdn.example.com/avatar.jpg" }),
      }),
    );
  });
});
