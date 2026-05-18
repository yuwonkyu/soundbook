import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Generic client — typed manually in db.ts until `supabase gen types` is run
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
