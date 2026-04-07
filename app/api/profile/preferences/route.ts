import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import {
  requireAuth,
  requireRateLimit,
  requireTrustedOrigin,
  validateBody,
} from '@/lib/server/api-helpers';
import { RL_PROFILE_UPDATE } from '@/lib/constants';
import type { ErrorResponse } from '@/types/auth';

const COOKIE_PREFIX = 'iv_prefs_';
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

const PreferencesSchema = z
  .object({
    notificationsEnabled: z.boolean().optional(),
    emailUpdatesEnabled: z.boolean().optional(),
  })
  .refine(
    (value) =>
      typeof value.notificationsEnabled === 'boolean' ||
      typeof value.emailUpdatesEnabled === 'boolean',
    {
      message: 'At least one preference field is required.',
    }
  );

type PreferencesPayload = {
  notificationsEnabled: boolean;
  emailUpdatesEnabled: boolean;
};

function getCookieKey(userId: string) {
  return `${COOKIE_PREFIX}${userId}`;
}

function parsePreferencesCookie(raw: string | undefined): PreferencesPayload {
  const defaults: PreferencesPayload = {
    notificationsEnabled: true,
    emailUpdatesEnabled: false,
  };

  if (!raw) return defaults;

  try {
    const parsed = JSON.parse(raw) as Partial<PreferencesPayload>;
    return {
      notificationsEnabled:
        typeof parsed.notificationsEnabled === 'boolean'
          ? parsed.notificationsEnabled
          : defaults.notificationsEnabled,
      emailUpdatesEnabled:
        typeof parsed.emailUpdatesEnabled === 'boolean'
          ? parsed.emailUpdatesEnabled
          : defaults.emailUpdatesEnabled,
    };
  } catch {
    return defaults;
  }
}

export async function GET(req: Request) {
  try {
    const { session, error: authError } = await requireAuth();
    if (authError) return authError;

    const rlError = requireRateLimit(
      req,
      `preferences:${session.user.id}`,
      RL_PROFILE_UPDATE
    );
    if (rlError) return rlError;

    const cookieStore = await cookies();
    const current = parsePreferencesCookie(
      cookieStore.get(getCookieKey(session.user.id))?.value
    );

    return NextResponse.json({ success: true, preferences: current });
  } catch (error) {
    console.error('Get preferences error:', error);
    return NextResponse.json<ErrorResponse>(
      {
        success: false,
        message: 'Failed to load preferences.',
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const originError = requireTrustedOrigin(req);
    if (originError) return originError;

    const { session, error: authError } = await requireAuth();
    if (authError) return authError;

    const rlError = requireRateLimit(
      req,
      `preferences:${session.user.id}`,
      RL_PROFILE_UPDATE
    );
    if (rlError) return rlError;

    const body = await req.json();
    const { data: validated, error: validationError } = validateBody(
      PreferencesSchema,
      body
    );
    if (validationError) return validationError;

    const cookieStore = await cookies();
    const existing = parsePreferencesCookie(
      cookieStore.get(getCookieKey(session.user.id))?.value
    );

    const merged: PreferencesPayload = {
      notificationsEnabled:
        typeof validated.notificationsEnabled === 'boolean'
          ? validated.notificationsEnabled
          : existing.notificationsEnabled,
      emailUpdatesEnabled:
        typeof validated.emailUpdatesEnabled === 'boolean'
          ? validated.emailUpdatesEnabled
          : existing.emailUpdatesEnabled,
    };

    const response = NextResponse.json({ success: true, preferences: merged });
    response.cookies.set(
      getCookieKey(session.user.id),
      JSON.stringify(merged),
      {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: ONE_YEAR_SECONDS,
      }
    );

    return response;
  } catch (error) {
    console.error('Update preferences error:', error);
    return NextResponse.json<ErrorResponse>(
      {
        success: false,
        message: 'Failed to update preferences.',
      },
      { status: 500 }
    );
  }
}
