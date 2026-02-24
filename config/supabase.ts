import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Server-side Supabase client using the service role key.
 * Used for Storage uploads (bypasses RLS).
 *
 * NEVER expose this client or the service role key to the browser.
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
