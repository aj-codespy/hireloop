"use server";

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { authNetworkErrorMessage, isNextRedirectError } from "@/lib/auth/errors"
import { passwordsMatch, validatePassword } from "@/lib/auth/validation"
import { generateId } from "@/lib/id"
import { createAdminClient } from "@/lib/supabase/admin"

export type AuthResult<T extends Record<string, unknown> = Record<string, unknown>> = {
  error?: string;
  ok?: boolean;
  data?: T;
};

// Server action to store company details temporarily
export async function storeCompanyDetailsAction(input: {
  orgName: string;
  orgSlug?: string;
  logoUrl?: string;
  defaultDepartment?: string;
}): Promise<AuthResult<{ orgSlug: string }>> {
  try {
    // Generate org slug if not provided
    const orgSlug = input.orgSlug || 
      input.orgName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 50);

    return { ok: true, data: { orgSlug } };
  } catch (error) {
    return { error: authNetworkErrorMessage(error) };
  }
}

// Server action to store admin user details temporarily
export async function storeAdminUserDetailsAction(input: {
  email: string;
  password: string;
  fullName: string;
  confirmPassword: string;
  orgSlug: string;
}): Promise<AuthResult<{
  email: string;
  password: string;
  fullName: string;
  orgSlug: string;
}>> {
  try {
    const passwordError = validatePassword(input.password);
    if (passwordError) return { error: passwordError };
    if (!passwordsMatch(input.password, input.confirmPassword)) {
      return { error: "Passwords do not match." };
    }
    if (!input.fullName.trim()) return { error: "Full name is required." };

    // Store admin user details
    return {
      ok: true,
      data: {
        email: input.email.toLowerCase().trim(),
        password: input.password,
        fullName: input.fullName.trim(),
        orgSlug: input.orgSlug,
      }
    };
  } catch (error) {
    return { error: authNetworkErrorMessage(error) };
  }
}

// Server action to store plan selection temporarily
export async function storePlanSelectionAction(input: {
  planId: string;
  planName: string;
  price: number;
  billingCycle: "monthly" | "yearly";
}): Promise<AuthResult<{
  planId: string;
  planName: string;
  price: number;
  billingCycle: "monthly" | "yearly";
}>> {
  try {
    return {
      ok: true,
      data: {
        planId: input.planId,
        planName: input.planName,
        price: input.price,
        billingCycle: input.billingCycle,
      }
    };
  } catch (error) {
    return { error: authNetworkErrorMessage(error) };
  }
}

// Server action to complete the signup with all stored data
export async function completeAdminSignupAction(input: {
  email: string;
  password: string;
  fullName: string;
  orgName: string;
  orgSlug: string;
  planId: string;
  planName: string;
  price: number;
  billingCycle: "monthly" | "yearly";
}): Promise<AuthResult<{ orgId: string; userId: string }>> {
  try {
    const admin = createAdminClient();
    const now = new Date().toISOString();

    // Create user first
    const { data, error } = await admin.auth.admin.createUser({
      email: input.email.trim().toLowerCase(),
      password: input.password,
      email_confirm: true,
      app_metadata: { account_type: "org_admin" },
      user_metadata: { full_name: input.fullName.trim() },
    });

    if (error) return { error: error.message };
    if (!data.user) return { error: "Could not create account" };

    // Create organization
    const orgId = generateId("org");
    const { error: orgError } = await admin.from("organizations").insert({
      id: orgId,
      name: input.orgName.trim(),
      slug: input.orgSlug,
      primary_color: "#FF6B00",
      created_at: now,
    });
    if (orgError) return { error: orgError.message };

    // Create organization member (owner)
    const { error: memberError } = await admin.from("organization_members").insert({
      id: generateId("om"),
      org_id: orgId,
      user_id: data.user.id,
      role: "owner",
      created_at: now,
    });
    if (memberError) return { error: memberError.message };

    // Create default department
    if (input.orgName) {
      const deptId = generateId("dept");
      await admin.from("departments").insert({
        id: deptId,
        org_id: orgId,
        name: input.orgName.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') || input.orgName,
        created_at: now,
      });
    }

    // Update profile
    await admin
      .from("profiles")
      .update({ full_name: input.fullName.trim(), account_type: "org_admin" })
      .eq("id", data.user.id);

    // Store plan information in organization (as metadata or separate table)
    await admin.from("organization_billing").insert({
      id: generateId("bill"),
      org_id: orgId,
      plan_id: input.planId,
      plan_name: input.planName,
      price: input.price,
      billing_cycle: input.billingCycle,
      status: "active",
      created_at: now,
    });

    revalidatePath("/", "layout");
    return { ok: true, data: { orgId, userId: data.user.id } };
  } catch (error) {
    if (isNextRedirectError(error)) throw error;
    return { error: authNetworkErrorMessage(error) };
  }
}