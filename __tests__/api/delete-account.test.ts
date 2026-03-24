import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks ────────────────────────────────────────────────────
const mockAuth = vi.fn();
const mockFindUnique = vi.fn();
const mockDelete = vi.fn();
const mockDeleteManyTokens = vi.fn();
const mockDeleteManyVerificationTokens = vi.fn();
const mockDeleteManyAccounts = vi.fn();
const mockDeleteManySessions = vi.fn();
const mockTransaction = vi.fn();

vi.mock('@/config/auth', () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
}));

vi.mock('@/config/db', () => ({
  db: {
    user: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      delete: (...args: unknown[]) => mockDelete(...args),
    },
    securityToken: {
      deleteMany: (...args: unknown[]) => mockDeleteManyTokens(...args),
    },
    verificationToken: {
      deleteMany: (...args: unknown[]) =>
        mockDeleteManyVerificationTokens(...args),
    },
    account: {
      deleteMany: (...args: unknown[]) => mockDeleteManyAccounts(...args),
    },
    session: {
      deleteMany: (...args: unknown[]) => mockDeleteManySessions(...args),
    },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
  isDatabaseConfigured: true,
}));

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi
    .fn()
    .mockReturnValue({ ok: true, remaining: 5, retryAfterMs: 0 }),
  rateLimitResponse: vi.fn(),
  getClientIp: vi.fn().mockReturnValue('127.0.0.1'),
}));

vi.mock('@/lib/security', () => ({
  ensureTrustedOrigin: vi.fn().mockReturnValue(null),
}));

vi.mock('@/lib/audit', () => ({
  logAudit: vi.fn(),
}));

// ── Helpers ──────────────────────────────────────────────────
function buildRequest(): Request {
  return new Request('http://localhost:3000/api/auth/delete-account', {
    method: 'DELETE',
  });
}

// ── Tests ────────────────────────────────────────────────────
describe('DELETE /api/auth/delete-account', () => {
  let DELETE: (req: Request) => Promise<Response>;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockTransaction.mockImplementation(
      async (callback: (tx: Record<string, unknown>) => Promise<unknown>) =>
        callback({
          verificationToken: { deleteMany: mockDeleteManyVerificationTokens },
          securityToken: { deleteMany: mockDeleteManyTokens },
          account: { deleteMany: mockDeleteManyAccounts },
          session: { deleteMany: mockDeleteManySessions },
          user: { delete: mockDelete },
        })
    );
    const mod = await import('@/app/api/auth/delete-account/route');
    DELETE = mod.DELETE;
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);
    const res = await DELETE(buildRequest());
    expect(res.status).toBe(401);
  });

  it('returns 404 when user not found in database', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } });
    mockFindUnique.mockResolvedValue(null);

    const res = await DELETE(buildRequest());
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.message).toMatch(/not found/i);
  });

  it('deletes a credential account successfully', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } });
    mockFindUnique.mockResolvedValue({ email: 'u@t.com' });
    mockDeleteManyVerificationTokens.mockResolvedValue({});
    mockDeleteManyTokens.mockResolvedValue({});
    mockDeleteManyAccounts.mockResolvedValue({});
    mockDeleteManySessions.mockResolvedValue({});
    mockDelete.mockResolvedValue({});

    const res = await DELETE(buildRequest());
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(mockTransaction).toHaveBeenCalled();
  });

  it('deletes an OAuth-only account successfully', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } });
    mockFindUnique.mockResolvedValue({ email: 'oauth@t.com' });
    mockDeleteManyVerificationTokens.mockResolvedValue({});
    mockDeleteManyTokens.mockResolvedValue({});
    mockDeleteManyAccounts.mockResolvedValue({});
    mockDeleteManySessions.mockResolvedValue({});
    mockDelete.mockResolvedValue({});

    const res = await DELETE(buildRequest());
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(mockTransaction).toHaveBeenCalled();
  });
});
