import { createClient } from "@supabase/supabase-js";

// Fallback to placeholder so createClient doesn't throw at module load time in mock mode.
// isMockMode() guards all actual calls, so these values are never used.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
