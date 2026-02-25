import { NextResponse } from "next/server";

function normalizeOrigin(value: string): string {
  try {
    return new URL(value).origin;
  } catch {
    return value;
  }
}

function allowedOriginsForRequest(req: Request): Set<string> {
  const set = new Set<string>();

  set.add(new URL(req.url).origin);

  const envOrigins = [
    process.env.NEXTAUTH_URL,
    process.env.NEXT_PUBLIC_APP_URL,
  ].filter(Boolean) as string[];

  for (const origin of envOrigins) {
    set.add(normalizeOrigin(origin));
  }

  return set;
}

/**
 * Require browser-origin requests for sensitive state-changing endpoints.
 * Rejects cross-site requests to reduce CSRF risk.
 */
export function ensureTrustedOrigin(req: Request): NextResponse | null {
  const origin = req.headers.get("origin");
  if (!origin) return null;

  const allowed = allowedOriginsForRequest(req);
  if (allowed.has(normalizeOrigin(origin))) return null;

  return NextResponse.json(
    { error: "Forbidden origin." },
    { status: 403 },
  );
}

