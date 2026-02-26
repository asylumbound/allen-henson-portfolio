import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let _supabase: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey) {
  _supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  console.warn(
    "[Supabase] VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set. Auth features will be unavailable."
  );
}

// Export a proxy that gracefully handles missing Supabase config
// This prevents the app from crashing when Supabase is not configured
export const supabase: SupabaseClient = _supabase ?? ({
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    getUser: async () => ({ data: { user: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signInWithPassword: async () => ({ data: { user: null, session: null }, error: { message: "Supabase not configured" } }),
    signUp: async () => ({ data: { user: null, session: null }, error: { message: "Supabase not configured" } }),
    signOut: async () => ({ error: null }),
  },
} as unknown as SupabaseClient);
