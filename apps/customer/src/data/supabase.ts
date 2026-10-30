/**
 * Supabase client for the customer app, or null when the app runs on demo data.
 *
 * Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_KEY (the publishable key,
 * safe to ship in the app: row level security decides what it can read).
 * Never put the secret/service_role key in the app.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_KEY;

export const supabase: SupabaseClient | null =
  url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
