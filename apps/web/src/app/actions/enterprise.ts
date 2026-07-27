"use server";

import { ORG_MANAGER_ROLES, ORG_PIPELINE_ROLES } from "@/lib/auth/permissions";
import { requireOrgRole } from "@/lib/auth/require-role";
import { generateId } from "@/lib/id";
import { createAdminClient } from "@/lib/supabase/admin";
import { isRedirectError } from 'next/dist/client/components/redirect-error';
import { isHTTPAccessFallbackError as isNotFoundError } from 'next/dist/client/components/http-access-fallback/http-access-fallback';

type ActionResult<T = unknown> = { ok?: boolean; data?: T; error?: string };

export async function createRequisitionAction(input: {
  title: string;
  departmentName?: string;
  headcount: number;
  budgetRange?: string;
}): Promise<ActionResult> {
  try {
    const { orgId, profile } = await requireOrgRole(ORG_MANAGER_ROLES);
    const supabase = createAdminClient();
    const now = new Date().toISOString();
    let departmentId: string | null = null;

    if (input.departmentName?.trim()) {
      const name = input.departmentName.trim();
      const { data: existing } = await supabase
        .from("departments")
        .select("id")
        .eq("org_id", orgId)
        .eq("name", name)
        .maybeSingle();

      if (existing?.id) {
        departmentId = existing.id;
      } else {
        departmentId = generateId("dept");
        const { error } = await supabase.from("departments").insert({
          id: departmentId,
          org_id: orgId,
          name,
          created_at: now,
        });
        if (error) return { ok: false, error: error.message };
      }
    }

    const { error } = await supabase.from("requisitions").insert({
      id: generateId("req"),
      org_id: orgId,
      department_id: departmentId,
      title: input.title.trim(),
      headcount: input.headcount,
      budget_range: input.budgetRange?.trim() || null,
      status: "pending_approval",
      created_by: profile.id,
      created_at: now,
      updated_at: now,
    });

    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    if (isRedirectError(err) || isNotFoundError(err)) {
      throw err;
    }
    return { ok: false, error: err instanceof Error ? err.message : "Failed to create requisition" };
  }
}

export async function approveRequisitionAction(input: {
  requisitionId: string;
  approved: boolean;
  notes?: string;
}): Promise<ActionResult> {
  try {
    const { orgId, profile } = await requireOrgRole(ORG_MANAGER_ROLES);
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("requisitions")
      .update({
        status: input.approved ? "approved" : "rejected",
        approval_notes: input.notes?.trim() || null,
        approved_by: input.approved ? profile.id : null,
        approved_at: input.approved ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.requisitionId)
      .eq("org_id", orgId);

    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    if (isRedirectError(err) || isNotFoundError(err)) {
      throw err;
    }
    return { ok: false, error: err instanceof Error ? err.message : "Failed to approve requisition" };
  }
}



export async function exportCandidateDataAction(email: string): Promise<ActionResult> {
  try {
    const { orgId } = await requireOrgRole(ORG_MANAGER_ROLES);
    const supabase = createAdminClient();
    const normalized = email.trim().toLowerCase();
    const { data: candidates, error } = await supabase
      .from("candidates")
      .select("*")
      .ilike("email", normalized);
    if (error) return { ok: false, error: error.message };

    const candidateIds = (candidates ?? []).map((candidate) => candidate.id);
    const { data: applications } = candidateIds.length
      ? await supabase.from("applications").select("*").in("candidate_id", candidateIds)
      : { data: [] };
    const orgJobIds = new Set(
      (
        await supabase.from("job_roles").select("id").eq("org_id", orgId)
      ).data?.map((job) => job.id) ?? []
    );

    return {
      ok: true,
      data: {
        candidates,
        applications: (applications ?? []).filter((app) => orgJobIds.has(app.job_role_id)),
      },
    };
  } catch (err) {
    if (isRedirectError(err) || isNotFoundError(err)) {
      throw err;
    }
    return { ok: false, error: err instanceof Error ? err.message : "Failed to export candidate data" };
  }
}

export async function eraseCandidateDataAction(email: string): Promise<ActionResult> {
  try {
    const { orgId } = await requireOrgRole(ORG_MANAGER_ROLES);
    const supabase = createAdminClient();
    const normalized = email.trim().toLowerCase();
    const { data: candidates, error } = await supabase
      .from("candidates")
      .select("id")
      .ilike("email", normalized);
    if (error) return { ok: false, error: error.message };

    const candidateIds = (candidates ?? []).map((candidate) => candidate.id);
    if (candidateIds.length === 0) return { ok: true };

    const { data: jobs } = await supabase.from("job_roles").select("id").eq("org_id", orgId);
    const jobIds = (jobs ?? []).map((job) => job.id);
    if (jobIds.length === 0) return { ok: true };

    await supabase.from("applications").delete().in("candidate_id", candidateIds).in("job_role_id", jobIds);
    await supabase.from("candidates").delete().in("id", candidateIds);
    return { ok: true };
  } catch (err) {
    if (isRedirectError(err) || isNotFoundError(err)) {
      throw err;
    }
    return { ok: false, error: err instanceof Error ? err.message : "Failed to erase candidate data" };
  }
}
