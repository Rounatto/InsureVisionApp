import { NextResponse } from "next/server";

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterMs: number;
}

/** No-op stub — always allows the request. */
export function checkRateLimit(
  _key: string,
  limit: number,
  _windowMs: number,
): RateLimitResult {
  return { ok: true, remaining: limit, retryAfterMs: 0 };
}

/** Stub — never actually called since checkRateLimit always passes. */
export function rateLimitResponse(_result: RateLimitResult): NextResponse {
  return NextResponse.json(
    { success: false, message: "Rate limited." },
    { status: 429 },
  );
}

/** Returns a dummy IP. */
export function getClientIp(_req: Request): string {
  return "127.0.0.1";
}
