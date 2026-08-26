import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Cliente com service_role — contorna RLS. Só usar em server actions que já
// verificaram papel admin manualmente; nunca expor ao navegador.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY não configurada (ver .env.local).");
  }

  return createSupabaseClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
