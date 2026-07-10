import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateId } from "@/lib/id";
import { createClient } from "@/utils/supabase/server";

type Portal = "admin" | "candidate";
type Intent = "signin" | "signup";

function loginUrl(portal: Portal, message: string) {
  const base = portal === "admin" ? "/admin/login" : "/candidate/login";
  return `${base}?error=${encodeURIComponent(message)}`;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const portal = (searchParams.get("portal") ?? "candidate") as Portal;
  const intent = (searchParams.get("intent") ?? "signin") as Intent;
  const accountType = portal === "admin" ? "org_admin" : "candidate";

  if (!code) {
    return NextResponse.redirect(new URL(loginUrl(portal, "Sign-in was cancelled."), origin));
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(
      new URL(loginUrl(portal, error?.message ?? "Could not complete sign-in."), origin)
    );
  }

  const userId = data.user.id;
  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("account_type")
    .eq("id", userId)
    .maybeSingle();

  if (intent === "signin") {
    if (!profile || profile.account_type !== accountType) {
      await supabase.auth.signOut();
      return NextResponse.redirect(
        new URL(
          loginUrl(
            portal,
            portal === "admin"
              ? "No organization admin account exists for this Google email. Use Create org or email sign-up."
              : "No candidate account exists for this Google email. Create a profile first."
          ),
          origin
        )
      );
    }
  } else {
    if (profile && profile.account_type !== accountType) {
      await supabase.auth.signOut();
      return NextResponse.redirect(
        new URL(loginUrl(portal, "This email is already registered with a different account type."), origin)
      );
    }

    await admin
      .from("profiles")
      .update({
        account_type: accountType,
        full_name:
          data.user.user_metadata?.full_name ||
          data.user.user_metadata?.name ||
          "",
        email: data.user.email ?? "",
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (accountType === "org_admin") {
      const cookieStore = await cookies();
      const orgName = cookieStore.get("hl_oauth_org")?.value;
      if (!orgName?.trim()) {
        return NextResponse.redirect(new URL("/admin/login?oauth=complete", origin));
      }

      const orgId = generateId("org");
      const now = new Date().toISOString();
      await admin.from("organizations").insert({
        id: orgId,
        name: orgName.trim(),
        primary_color: "#FF6B00",
        created_at: now,
      });
      await admin.from("organization_members").insert({
        id: generateId("om"),
        org_id: orgId,
        user_id: userId,
        role: "owner",
        created_at: now,
      });
      cookieStore.delete("hl_oauth_org");
    }
  }

  const destination = portal === "admin" ? "/admin" : "/candidate/profile";
  return NextResponse.redirect(new URL(destination, origin));
}
