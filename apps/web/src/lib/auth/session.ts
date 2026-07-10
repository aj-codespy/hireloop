import type { SupabaseClient } from "@supabase/supabase-js";

/** Prefer local session cookie; fall back to verified claims when needed. */
export async function getAuthUserId(supabase: SupabaseClient): Promise<string | null> {
  const { data: sessionData } = await supabase.auth.getSession();
  const sessionUserId = sessionData.session?.user?.id;
  if (sessionUserId) return sessionUserId;

  try {
    const { data: claims } = await supabase.auth.getClaims();
    return (claims?.claims?.sub as string | undefined) ?? null;
  } catch {
    return null;
  }
}
