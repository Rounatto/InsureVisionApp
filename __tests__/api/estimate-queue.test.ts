import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockAuth = vi.fn();
const mockQueueEstimateJob = vi.fn();
const mockDispatchEstimateJob = vi.fn();

vi.mock('@/config/auth', () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
}));

vi.mock('@/config/db', () => ({
  db: {
    user: {
      findUnique: vi.fn().mockResolvedValue({ banned: false }),
    },
  },
  isDatabaseConfigured: true,
}));

vi.mock('@/lib/security', () => ({
  ensureTrustedOrigin: vi.fn().mockReturnValue(null),
}));

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi
    .fn()
    .mockReturnValue({ ok: true, remaining: 5, retryAfterMs: 0 }),
  rateLimitResponse: vi.fn(),
  getClientIp: vi.fn().mockReturnValue('127.0.0.1'),
}));

vi.mock('@/lib/server/estimate/jobs', () => ({
  queueEstimateJob: (...args: unknown[]) => mockQueueEstimateJob(...args),
  dispatchEstimateJob: (...args: unknown[]) => mockDispatchEstimateJob(...args),
}));

describe('POST /api/estimate (queue flow)', () => {
  let POST: (req: Request) => Promise<Response>;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockQueueEstimateJob.mockResolvedValue({ id: 'job_123', status: 'QUEUED' });
    mockDispatchEstimateJob.mockResolvedValue(undefined);

    const mod = await import('@/app/api/estimate/route');
    POST = mod.POST;
  });

  it('returns 401 for unauthenticated requests', async () => {
    mockAuth.mockResolvedValue(null);

    const res = await POST(
      new Request('http://localhost/api/estimate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ photoUrls: ['https://example.com/a.jpg'] }),
      })
    );

    expect(res.status).toBe(401);
  });

  it('returns 400 when photoUrls is missing', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } });

    const res = await POST(
      new Request('http://localhost/api/estimate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      })
    );

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.message).toMatch(/uploaded photo url/i);
  });

  it('queues and dispatches a job for valid photoUrls', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } });

    const res = await POST(
      new Request('http://localhost/api/estimate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          photoUrls: ['https://example.com/a.jpg', 'https://example.com/b.jpg'],
        }),
      })
    );

    expect(res.status).toBe(202);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.jobId).toBe('job_123');

    expect(mockQueueEstimateJob).toHaveBeenCalledWith({
      userId: 'u1',
      photoUrls: ['https://example.com/a.jpg', 'https://example.com/b.jpg'],
      photoCount: 2,
    });
    expect(mockDispatchEstimateJob).toHaveBeenCalledWith('job_123');
  });
});
