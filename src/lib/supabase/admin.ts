import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/lib/env";

let client: SupabaseClient | undefined;

export function getSupabaseAdmin() {
  if (client) return client;

  const { url, secretKey } = getSupabaseConfig();
  client = createClient(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });

  return client;
}
