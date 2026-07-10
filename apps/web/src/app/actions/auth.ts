"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { authNetworkErrorMessage, isNextRedirectError } from "@/lib/auth/errors";
import { passwordsMatch, validatePassword } from "@/lib/auth/validation";
import { generateId } from "@/lib/id";
import { createAdminClient } from "@/lib/supabase/admin";
import { mapOrganizationMember, mapProfile } from "@/lib/supabase/mappers";
import type { AccountType, OrgMemberRole, Profile } from "@/lib/types";
import { createClient } from "@/utils/supabase/server";
import { getAuthUserId } from "@/lib/auth/session";

export type AuthResult = { error?: string; ok?: boolean };

async function ensureProfileAccountType(userId: string, accountType: AccountType) {
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("account_type")
    .eq("id", userId)
    .maybeSingle();

  if (profile && profile.account_type !== accountType) {
    return { error: `This account is not a ${accountType.replace("_", " ")} account.` };
  }

  if (!profile) {
    await admin.from("profiles").insert({
      id: userId,
      account_type: accountType,
      email: "",
      full_name: "",
    });
  } else if (profile.account_type !== accountType) {
    await admin.from("profiles").update({ account_type: accountType }).eq("id", userId);
  }

  return {};
}

export async function signInAction(
  email: string,
  password: string,
  accountType: AccountType
): Promise<AuthResult> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) return { error: error.message };

    const { data: profileRow } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .maybeSingle();

    if (profileRow && profileRow.account_type !== accountType) {
      await supabase.auth.signOut();
      return { error: `This account is not a ${accountType.replace("_", " ")} account.` };
    }

    if (!profileRow) {
      const ensured = await ensureProfileAccountType(data.user.id, accountType);
      if (ensured.error) {
        await supabase.auth.signOut();
        return { error: ensured.error };
      }
      const admin = createAdminClient();
      await admin
        .from("profiles")
        .update({
          email: data.user.email ?? email.trim().toLowerCase(),
          full_name: (data.user.user_metadata?.full_name as string | undefined) ?? "",
        })
        .eq("id", data.user.id);
    }

    revalidatePath("/", "layout");
    if (accountType === "org_admin") redirect("/admin");
    redirect("/candidate/profile");
  } catch (error) {
    if (isNextRedirectError(error)) throw error;
    return { error: authNetworkErrorMessage(error) };
  }
}

export async function sendOtpAction(input: {
  email: string;
  accountType: AccountType;
  mode: "signin" | "signup";
  fullName?: string;
  phone?: string;
  orgName?: string;
}): Promise<AuthResult> {
  const email = input.email.trim().toLowerCase();
  if (!email) return { error: "Email is required." };

  const admin = createAdminClient();

  if (input.mode === "signin") {
    const { data: users } = await admin.auth.admin.listUsers({ perPage: 1000 });
    const existing = users.users.find((u) => u.email?.toLowerCase() === email);
    if (!existing) {
      return { error: "No account found for this email. Create a profile first." };
    }
    const { data: profile } = await admin
      .from("profiles")
      .select("account_type")
      .eq("id", existing.id)
      .maybeSingle();
    if (profile && profile.account_type !== input.accountType) {
      return {
        error: `This email belongs to a ${profile.account_type.replace("_", " ")} account.`,
      };
    }
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: input.mode === "signup",
        data:
          input.mode === "signup"
            ? {
                full_name: input.fullName?.trim() ?? "",
                phone: input.phone ?? "",
                org_name: input.orgName ?? "",
              }
            : undefined,
      },
    });
    if (error) return { error: error.message };
    return { ok: true };
  } catch (error) {
    return { error: authNetworkErrorMessage(error) };
  }
}

export async function verifyOtpAction(input: {
  email: string;
  token: string;
  accountType: AccountType;
  mode: "signin" | "signup";
  fullName?: string;
  phone?: string;
  orgName?: string;
}): Promise<AuthResult> {
  const email = input.email.trim().toLowerCase();
  const token = input.token.trim();

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });
    if (error) return { error: error.message };
    if (!data.user) return { error: "Could not verify code." };

    const admin = createAdminClient();
    const userId = data.user.id;

    if (input.mode === "signup") {
      if (input.accountType === "org_admin") {
        if (!input.orgName?.trim()) return { error: "Organization name is required." };
        if (!input.fullName?.trim()) return { error: "Full name is required." };

        const orgId = generateId("org");
        const now = new Date().toISOString();

        await admin
          .from("profiles")
          .update({
            account_type: "org_admin",
            full_name: input.fullName.trim(),
            email,
            updated_at: now,
          })
          .eq("id", userId);

        await admin.from("organizations").insert({
          id: orgId,
          name: input.orgName.trim(),
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
      } else {
        if (!input.fullName?.trim()) return { error: "Full name is required." };
        await admin
          .from("profiles")
          .update({
            account_type: "candidate",
            full_name: input.fullName.trim(),
            phone: input.phone ?? null,
            email,
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);
      }
    } else {
      const typeCheck = await ensureProfileAccountType(userId, input.accountType);
      if (typeCheck.error) {
        await supabase.auth.signOut();
        return typeCheck;
      }
    }

    revalidatePath("/", "layout");
    if (input.accountType === "org_admin") redirect("/admin");
    redirect("/candidate/profile");
  } catch (error) {
    if (isNextRedirectError(error)) throw error;
    return { error: authNetworkErrorMessage(error) };
  }
}

export async function finalizeOtpSignupAction(input: {
  accountType: AccountType;
  fullName?: string;
  phone?: string;
  orgName?: string;
}): Promise<AuthResult> {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub as string | undefined;
  if (!userId) return { error: "Not signed in after verification." };

  const admin = createAdminClient();
  const now = new Date().toISOString();

  if (input.accountType === "org_admin") {
    if (!input.orgName?.trim() || !input.fullName?.trim()) {
      return { error: "Organization name and full name are required." };
    }
    const orgId = generateId("org");
    await admin
      .from("profiles")
      .update({
        account_type: "org_admin",
        full_name: input.fullName.trim(),
        updated_at: now,
      })
      .eq("id", userId);
    await admin.from("organizations").insert({
      id: orgId,
      name: input.orgName.trim(),
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
  } else {
    if (!input.fullName?.trim()) return { error: "Full name is required." };
    await admin
      .from("profiles")
      .update({
        account_type: "candidate",
        full_name: input.fullName.trim(),
        phone: input.phone ?? null,
        updated_at: now,
      })
      .eq("id", userId);
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

export async function signUpCandidateAction(input: {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  phone?: string;
}): Promise<AuthResult> {
  const passwordError = validatePassword(input.password);
  if (passwordError) return { error: passwordError };
  if (!passwordsMatch(input.password, input.confirmPassword)) {
    return { error: "Passwords do not match." };
  }
  if (!input.fullName.trim()) return { error: "Full name is required." };

  const admin = createAdminClient();

  const { data, error } = await admin.auth.admin.createUser({
    email: input.email.trim().toLowerCase(),
    password: input.password,
    email_confirm: true,
    app_metadata: { account_type: "candidate" },
    user_metadata: { full_name: input.fullName.trim() },
  });

  if (error) return { error: error.message };
  if (!data.user) return { error: "Could not create account" };

  if (input.phone) {
    await admin
      .from("profiles")
      .update({
        phone: input.phone,
        full_name: input.fullName.trim(),
        account_type: "candidate",
      })
      .eq("id", data.user.id);
  }

  try {
    const supabase = await createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: input.email.trim().toLowerCase(),
      password: input.password,
    });
    if (signInError) return { error: signInError.message };
    revalidatePath("/", "layout");
    redirect("/candidate/profile");
  } catch (error) {
    if (isNextRedirectError(error)) throw error;
    return { error: authNetworkErrorMessage(error) };
  }
}

export async function signUpOrgAdminAction(input: {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  orgName: string;
}): Promise<AuthResult> {
  const passwordError = validatePassword(input.password);
  if (passwordError) return { error: passwordError };
  if (!passwordsMatch(input.password, input.confirmPassword)) {
    return { error: "Passwords do not match." };
  }
  if (!input.fullName.trim()) return { error: "Full name is required." };
  if (!input.orgName.trim()) return { error: "Organization name is required." };

  const admin = createAdminClient();

  const { data, error } = await admin.auth.admin.createUser({
    email: input.email.trim().toLowerCase(),
    password: input.password,
    email_confirm: true,
    app_metadata: { account_type: "org_admin" },
    user_metadata: { full_name: input.fullName.trim() },
  });

  if (error) return { error: error.message };
  if (!data.user) return { error: "Could not create account" };

  const orgId = generateId("org");
  const now = new Date().toISOString();

  const { error: orgError } = await admin.from("organizations").insert({
    id: orgId,
    name: input.orgName.trim(),
    primary_color: "#FF6B00",
    created_at: now,
  });
  if (orgError) return { error: orgError.message };

  const { error: memberError } = await admin.from("organization_members").insert({
    id: generateId("om"),
    org_id: orgId,
    user_id: data.user.id,
    role: "owner",
    created_at: now,
  });
  if (memberError) return { error: memberError.message };

  await admin
    .from("profiles")
    .update({ full_name: input.fullName.trim(), account_type: "org_admin" })
    .eq("id", data.user.id);

  try {
    const supabase = await createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: input.email.trim().toLowerCase(),
      password: input.password,
    });
    if (signInError) return { error: signInError.message };
    revalidatePath("/", "layout");
    redirect("/admin");
  } catch (error) {
    if (isNextRedirectError(error)) throw error;
    return { error: authNetworkErrorMessage(error) };
  }
}

export async function getCurrentProfileAction(): Promise<Profile | null> {
  const supabase = await createClient();
  const userId = await getAuthUserId(supabase);
  if (!userId) return null;

  const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  return data ? mapProfile(data) : null;
}

export async function updateCandidateProfileAction(input: {
  fullName: string;
  phone?: string;
}): Promise<AuthResult> {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub as string | undefined;
  if (!userId) return { error: "Not signed in" };

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: input.fullName.trim(),
      phone: input.phone ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) return { error: error.message };

  await supabase
    .from("candidates")
    .update({
      name: input.fullName.trim(),
      phone: input.phone ?? null,
    })
    .eq("profile_id", userId);

  revalidatePath("/candidate/profile");
  return {};
}

export async function updateAdminProfileAction(input: {
  fullName: string;
  phone?: string;
}): Promise<AuthResult> {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub as string | undefined;
  if (!userId) return { error: "Not signed in" };

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: input.fullName.trim(),
      phone: input.phone ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .eq("account_type", "org_admin");

  if (error) return { error: error.message };

  revalidatePath("/admin/settings");
  return { ok: true };
}

export async function updatePasswordAction(input: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<AuthResult> {
  const passwordError = validatePassword(input.newPassword);
  if (passwordError) return { error: passwordError };
  if (!passwordsMatch(input.newPassword, input.confirmPassword)) {
    return { error: "Passwords do not match." };
  }

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub as string | undefined;
  if (!userId) return { error: "Not signed in" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", userId)
    .single();

  if (!profile?.email) return { error: "Could not confirm account email." };

  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: profile.email,
    password: input.currentPassword,
  });
  if (verifyError) return { error: "Current password is incorrect." };

  const { error } = await supabase.auth.updateUser({ password: input.newPassword });
  if (error) return { error: error.message };

  return { ok: true };
}

export async function getAdminOrgIdAction(): Promise<string | null> {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub as string | undefined;
  if (!userId) return null;

  const { data } = await supabase
    .from("organization_members")
    .select("*")
    .eq("user_id", userId)
    .in("role", [
      "owner",
      "admin",
      "recruiter",
      "hiring_manager",
      "interviewer",
      "coordinator",
      "reporting_viewer",
      "final_interviewer",
    ])
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return data ? mapOrganizationMember(data).orgId : null;
}

export async function getOrgMemberRoleAction(): Promise<OrgMemberRole | null> {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub as string | undefined;
  if (!userId) return null;

  const orgId = await getAdminOrgIdAction();
  if (!orgId) return null;

  const { data } = await supabase
    .from("organization_members")
    .select("role")
    .eq("user_id", userId)
    .eq("org_id", orgId)
    .maybeSingle();

  return (data?.role as OrgMemberRole | undefined) ?? null;
}

export async function inviteTeamMemberAction(input: {
  email: string;
  password: string;
  fullName: string;
  role: Exclude<OrgMemberRole, "owner">;
}): Promise<AuthResult> {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const adminUserId = claims?.claims?.sub as string | undefined;
  if (!adminUserId) return { error: "Not signed in" };

  const { data: membership } = await supabase
    .from("organization_members")
    .select("org_id, role")
    .eq("user_id", adminUserId)
    .in("role", ["owner", "admin"])
    .limit(1)
    .maybeSingle();

  if (!membership) return { error: "Only org owners/admins can invite team members" };

  if (
    ![
      "admin",
      "recruiter",
      "hiring_manager",
      "interviewer",
      "coordinator",
      "reporting_viewer",
      "final_interviewer",
    ].includes(input.role)
  ) {
    return { error: "Invalid role" };
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email: input.email.trim().toLowerCase(),
    password: input.password,
    email_confirm: true,
    app_metadata: { account_type: "org_admin" },
    user_metadata: { full_name: input.fullName.trim() },
  });

  if (error) return { error: error.message };
  if (!data.user) return { error: "Could not create account" };

  await admin
    .from("profiles")
    .update({ full_name: input.fullName.trim(), account_type: "org_admin" })
    .eq("id", data.user.id);

  const { error: memberError } = await admin.from("organization_members").insert({
    id: generateId("om"),
    org_id: membership.org_id,
    user_id: data.user.id,
    role: input.role,
    created_at: new Date().toISOString(),
  });

  if (memberError) return { error: memberError.message };

  revalidatePath("/admin/settings");
  return {};
}
