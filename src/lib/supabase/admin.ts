import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client that bypasses RLS. Server-side only — used by the
 * public signup pages and volunteer signup/edit route handlers so volunteer
 * emails and edit tokens never reach the browser.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
