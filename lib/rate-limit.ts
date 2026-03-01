/**
 * In-memory sliding-window rate limiter.
 *
 * Good for single-server / Vercel-function deployments.
 * For multi-server or long-lived serverless pools, swap the
 * backing Map for Redis (e.g. @upstash/ratelimit).
 */
import { NextResponse } from "next/server";

/* ─── Types ─────────────────────────────────────────────── */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterMs: number;
}

/* ─── Store (survives HMR via globalThis, like the Prisma singleton) ─── */

const g = globalThis as unknown as {
  _rlStore?: Map<string, RateLimitRecord>;
  _rlTimer?: boolean;
};

const store: Map<string, RateLimitRecord> = g._rlStore ?? new Map();
if (!g._rlStore) g._rlStore = store;

// Purge expired entries every 60 s; .unref() so it never blocks shutdown.
if (!g._rlTimer && process.env.NODE_ENV !== "test") {
  g._rlTimer = true;
  const t = setInterval(() => {
    const now = Date.now();
    for (const [key, rec] of store) {
      if (now > rec.resetAt) store.delete(key);
    }
  }, 60_000);
  if (typeof t.unref === "function") t.unref();
}

/* ─── Core ──────────────────────────────────────────────── */

/**
 * Check whether `key` is within `limit` requests per `windowMs`.
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const rec = store.get(key);

  if (!rec || now > rec.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterMs: 0 };
  }

  if (rec.count >= limit) {
    return { ok: false, remaining: 0, retryAfterMs: rec.resetAt - now };
  }

  rec.count += 1;
  return { ok: true, remaining: limit - rec.count, retryAfterMs: 0 };
}

/**
 * Convenience 429 response with Retry-After header.
 */
export function rateLimitResponse(result: RateLimitResult): NextResponse {
  return NextResponse.json(
    { success: false, message: "Too many requests. Please try again later." },
    {
      status: 429,
      headers: {
        "Retry-After": String(Math.ceil(result.retryAfterMs / 1000)),
        "X-RateLimit-Remaining": String(result.remaining),
      },
    },
  );
}

/**
 * Extract the most-likely client IP from request headers.
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
