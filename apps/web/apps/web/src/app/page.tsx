import { createClient } from "@/utils/supabase/server";
import { LandingPage } from "@/components/home/landing-page";

export default async function HomePage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userEmail = data?.claims?.email as string | undefined;

  return (
    <LandingPage
      userEmail={userEmail ?? null}
      currentYear={new Date().getFullYear()}
    />
  );
}
