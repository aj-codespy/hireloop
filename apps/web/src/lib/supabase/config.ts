export function getSupabaseUrl(): string | undefined {
  return process.env.NEXT_PUBLIC_SUPABASE_URL;
}

export function getSupabasePublishableKey(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

/** Elevated server key — new `sb_secret_...` or legacy `service_role` JWT */
export function getSupabaseSecretKey(): string | undefined {
  return process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
}

/** @deprecated Use getSupabaseSecretKey */
export function getSupabaseServiceRoleKey(): string | undefined {
  return getSupabaseSecretKey();
}

/** True when server-side Supabase reads/writes are available */
export function isSupabaseServerEnabled(): boolean {
  return Boolean(getSupabaseUrl() && getSupabaseSecretKey());
}

/** True when browser can talk to Supabase directly (optional; we prefer server actions) */
export function isSupabaseClientEnabled(): boolean {
  return Boolean(getSupabaseUrl() && getSupabasePublishableKey());
}

export function isSupabaseEnabled(): boolean {
  return isSupabaseServerEnabled();
}
