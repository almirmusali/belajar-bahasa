import { createClient } from "@supabase/supabase-js";
import { getSupabaseUrl } from "./env";

// Service-role клиент. Только для серверного кода (API-роуты, RSC админки):
// ключ обходит RLS и не должен утечь в клиентский бандл — поэтому здесь нет
// "use client", а ключ читается из непубличной переменной окружения.
export function createSupabaseAdminClient() {
  const url = getSupabaseUrl();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
