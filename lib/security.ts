import { NextResponse } from "next/server";

/** No-op stub — allows all origins for presentation. */
export function ensureTrustedOrigin(_req: Request): NextResponse | null {
  return null;
}
