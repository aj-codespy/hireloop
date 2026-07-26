import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import { generateId } from "@/lib/id";
import { PhosphorIcon } from "@/components/icons/phosphor-icon";

const VALID_ROLES = [
  "admin",
  "recruiter",
  "hiring_manager",
  "interviewer",
  "coordinator",
  "reporting_viewer",
];

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Verify caller is an org owner or admin
  const { data: membership } = await supabase
    .from("organization_members")
    .select("org_id, role")
    .eq("user_id", user.id)
    .in("role", ["owner", "admin"])
    .limit(1)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json({ error: "Only org owners and admins can invite" }, { status: 403 });
  }

  const body = await request.json();
  const email = (body.email ?? "").trim().toLowerCase();
  const fullName = (body.fullName ?? "").trim();
  const role = body.role;

  if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });
  if (!fullName) return NextResponse.json({ error: "Full name is required" }, { status: 400 });
  if (!VALID_ROLES.includes(role)) {
    return NextResponse.json({ error: `Invalid role: ${role}` }, { status: 400 });
  }

  const admin = createAdminClient();

  // Use Supabase inviteUserByEmail — sends a magic link email.
  // User clicks the link, sets their own password, and lands on the callback route.
  const { data: inviteData, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    data: {
      full_name: fullName,
      account_type: "org_admin",
      invited_by: user.id,
      org_id: membership.org_id,
      org_role: role,
    },
    redirectTo: `${request.nextUrl.origin}/auth/callback?portal=admin&intent=invite`,
  });

  if (inviteError) {
    return NextResponse.json({ error: inviteError.message }, { status: 400 });
  }

  if (!inviteData.user) {
    return NextResponse.json({ error: "Could not create user" }, { status: 500 });
  }

  // Create profile
  await admin.from("profiles").upsert({
    id: inviteData.user.id,
    full_name: fullName,
    email,
    account_type: "org_admin",
    created_at: new Date().toISOString(),
  });

  // Link to org with the selected role
  await admin.from("organization_members").upsert({
    id: generateId("om"),
    org_id: membership.org_id,
    user_id: inviteData.user.id,
    role,
    created_at: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true });
}
