import { createClient, type SupabaseClient, type SupportedStorage } from "@supabase/supabase-js";

/**
 * Supabase client for a staff app, or null when the app runs on demo data.
 *
 * Reads EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_KEY (the public
 * publishable key: row level security and each staff member's role decide what
 * they can see and do). The session is kept so staff stay signed in.
 *
 * On the web the browser keeps the session by itself. On a phone pass a storage
 * (the rider app passes AsyncStorage).
 */
export function staffClientFromEnv(storage?: SupportedStorage): SupabaseClient | null {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key = process.env.EXPO_PUBLIC_SUPABASE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true, storage, detectSessionInUrl: false },
  });
}
