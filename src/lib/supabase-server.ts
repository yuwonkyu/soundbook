import { createClient } from "@supabase/supabase-js";

// Service role client — server-side only, bypasses RLS for write operations
export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
