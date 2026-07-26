"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { getAppOrigin } from "@/lib/auth/app-url";
import { Button } from "@/components/ui/button";
import { PhosphorIcon } from "@/components/icons/phosphor-icon";

export function GoogleSignInButton({
  portal,
  intent = "signin",
  disabled,
  onBeforeOAuth,
}: {
  portal: "admin" | "candidate";
  intent?: "signin" | "signup";
  disabled?: boolean;
  onBeforeOAuth?: () => boolean | void;
}) {
  const [loading, setLoading] = useState(false);

  async function handleGoogle() {
    setLoading(true);
    try {
      if (onBeforeOAuth?.() === false) {
        setLoading(false);
        return;
      }
      const supabase = createClient();
      const origin = getAppOrigin();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${origin}/auth/callback?portal=${portal}&intent=${intent}`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });
      if (error) toast.error(error.message);
    } catch {
      toast.error("Could not start Google sign-in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="h-12 w-full rounded-full border-[#ECECEC] bg-white font-semibold hover:bg-[#FAFAF9]"
      disabled={disabled || loading}
      onClick={handleGoogle}
    >
      {loading ? (
        <PhosphorIcon name="Loader2" />
      ) : null}
      <span>Continue with Google</span>
    </Button>
  );
}

export function setOAuthOrgCookie(orgName: string) {
  document.cookie = `hl_oauth_org=${encodeURIComponent(orgName)}; path=/; max-age=600; SameSite=Lax`;
}
