import { createClient } from "@/utils/supabase/server";
import { HomePageClient } from "@/components/home/home-page-client";

export default async function HomePage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userEmail = data?.claims?.email as string | undefined;

  return (
    <div className="min-h-screen overflow-hidden bg-background text-foreground">
      <section className="relative border-b border-border">
        <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-gradient mb-4">HireLoop</h1>
          <p className="text-xl text-muted-foreground mb-8">Structured hiring from application to decision.</p>
          <div className="flex justify-center">
            <a href="/login" className="inline-block px-8 py-3 rounded-full bg-brand text-brand-foreground hover:bg-brand/90 transition-colors">Get Started</a>
          </div>
        </div>
      </section>
      <HomePageClient userEmail={userEmail ?? null} />
    </div>
  );
}
