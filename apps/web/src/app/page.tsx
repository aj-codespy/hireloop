import { createClient } from "@/utils/supabase/server";
import { HomePageClient } from "@/components/home/home-page-client";

export default async function HomePage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userEmail = data?.claims?.email as string | undefined;

  return <HomePageClient userEmail={userEmail ?? null} />;
}