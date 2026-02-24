import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Lazy-initialized server-side Supabase client (service role key).
 * Used for Storage uploads (bypasses RLS).
 *
 * NEVER expose this client or the service role key to the browser.
 */
let _client: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!_client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars");
    }

    _client = createClient(url, key);
  }
  return _client;
}
