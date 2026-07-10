"use server";

import { getAdminOrgIdAction, getCurrentProfileAction } from "@/app/actions/auth";
import { ORG_MANAGER_ROLES, ORG_PIPELINE_ROLES } from "@/lib/auth/permissions";
import { requireOrgRole } from "@/lib/auth/require-role";
import { isDocumentFieldType, isApplicationDocument } from "@/lib/form-fields";
import { generateId } from "@/lib/id";
import { isSupabaseServerEnabled } from "@/lib/supabase/config";
import { sendInterviewLinkEmail, isEmailConfigured } from "@/lib/email/send-interview-link";
import { sendApplicationStatusEmail } from "@/lib/email/send-application-status";
import { canRegenerateInterviewLink } from "@/lib/interview-link";
import {
  createJobInDb,
  fetchHireLoopState,
  fetchInterviewContextByToken,
  regenerateInterviewLinkInDb,
  setJobQuestionsInDb,
  submitApplicationInDb,
  updateApplicationStatusInDb,
  updateJobInDb,
  updateOrganizationInDb,
} from "@/lib/supabase/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import { createApplicationDocumentSignedUrl, createProctoringSnapshotSignedUrl, uploadApplicationDocument } from "@/lib/supabase/storage";
import type { HireLoopState } from "@/lib/store/provider";
import type { CreateJobInput, QuestionInput } from "@/lib/store/provider";
import type {
  Application,
  ApplicationStatus,
  Candidate,
  FormResponseValue,
  JobRole,
  Organization,
} from "@/lib/types";
import { mapJobRole, mapApplication, mapOrganization } from "@/lib/supabase/mappers";
import type { InterviewTokenContext } from "@/lib/supabase/queries";

export async function loadHireLoopStateAction(): Promise<HireLoopState | null> {
  if (!isSupabaseServerEnabled()) return null;
  const profile = await getCurrentProfileAction();
  if (!profile || profile.accountType !== "org_admin") return null;
  const orgId = await getAdminOrgIdAction();
  if (!orgId) return null;
  return fetchHireLoopState(orgId);
}

export type CandidatePortalData = {
  applications: Application[];
  jobs: JobRole[];
};

export async function loadCandidatePortalDataAction(): Promise<CandidatePortalData | null> {
  if (!isSupabaseServerEnabled()) return null;
  const profile = await getCurrentProfileAction();
  if (!profile || profile.accountType !== "candidate") return null;

  const supabase = createAdminClient();

  const { data: byProfile, error: profileLinkError } = await supabase
    .from("candidates")
    .select("*")
    .eq("profile_id", profile.id);

  if (profileLinkError) throw new Error(profileLinkError.message);

  let candidateRows = byProfile ?? [];
  const email = profile.email.trim().toLowerCase();
  if (candidateRows.length === 0 && email) {
    const { data: byEmail, error: emailLinkError } = await supabase
      .from("candidates")
      .select("*")
      .ilike("email", email);
    if (emailLinkError) throw new Error(emailLinkError.message);
    candidateRows = byEmail ?? [];
  }

  if (!candidateRows.length) return { applications: [], jobs: [] };

  const candidateIds = candidateRows.map((row) => row.id as string);
  const { data: applicationRows, error: applicationError } = await supabase
    .from("applications")
    .select("*")
    .in("candidate_id", candidateIds)
    .order("created_at", { ascending: false });

  if (applicationError) throw new Error(applicationError.message);

  const applications = (applicationRows ?? []).map(mapApplication);
  const jobIds = [...new Set(applications.map((app) => app.jobRoleId))];
  if (jobIds.length === 0) return { applications, jobs: [] };

  const { data: jobRows, error: jobError } = await supabase
    .from("job_roles")
    .select("*")
    .in("id", jobIds);

  if (jobError) throw new Error(jobError.message);

  return {
    applications,
    jobs: (jobRows ?? []).map(mapJobRole),
  };
}

export async function loadInterviewByTokenAction(
  token: string
): Promise<InterviewTokenContext | null> {
  if (!isSupabaseServerEnabled()) return null;
  return fetchInterviewContextByToken(token);
}

export async function loadPublicJobAction(jobId: string): Promise<{
  job: JobRole;
  organization: Organization;
} | null> {
  if (!isSupabaseServerEnabled()) return null;

  const supabase = createAdminClient();
  const { data: jobRow } = await supabase
    .from("job_roles")
    .select("*")
    .eq("id", jobId)
    .eq("status", "live")
    .maybeSingle();

  if (!jobRow) return null;
  const job = mapJobRole(jobRow);
  const { data: orgRow } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", job.orgId)
    .single();

  return {
    job,
    organization: orgRow ? mapOrganization(orgRow) : {
      id: job.orgId,
      name: "HireLoop",
      primaryColor: "#FF6B00",
    },
  };
}

export async function loadPublicOrgJobsAction(orgId: string): Promise<{
  organization: Organization;
  jobs: JobRole[];
} | null> {
  if (!isSupabaseServerEnabled()) return null;

  const supabase = createAdminClient();
  const [{ data: orgRow }, { data: jobRows }] = await Promise.all([
    supabase.from("organizations").select("*").eq("id", orgId).maybeSingle(),
    supabase
      .from("job_roles")
      .select("*")
      .eq("org_id", orgId)
      .eq("status", "live")
      .order("created_at", { ascending: false }),
  ]);

  if (!orgRow) return null;
  return {
    organization: mapOrganization(orgRow),
    jobs: (jobRows ?? []).map(mapJobRole),
  };
}

export async function createJobAction(input: CreateJobInput): Promise<JobRole> {
  const { orgId } = await requireOrgRole(ORG_MANAGER_ROLES);
  return createJobInDb(orgId, input);
}

export async function updateJobAction(
  id: string,
  patch: Partial<JobRole>
): Promise<JobRole> {
  await requireOrgRole(ORG_MANAGER_ROLES);
  return updateJobInDb(id, patch);
}

export async function setJobQuestionsAction(
  jobId: string,
  questions: QuestionInput[],
  interviewQuestionCount?: number | null
): Promise<void> {
  await requireOrgRole(ORG_MANAGER_ROLES);
  await setJobQuestionsInDb(jobId, questions, interviewQuestionCount);

  const questionIds = questions.map((q) => q.id).filter(Boolean) as string[];
  if (!questionIds.length) return;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
  const secret = process.env.INTERVIEW_INTERNAL_SECRET ?? "";
  if (!secret) {
    throw new Error("Audio generation failed: Missing INTERVIEW_INTERNAL_SECRET environment variable.");
  }

  let response: Response;
  try {
    response = await fetch(`${apiUrl}/admin/questions/render-audio`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Secret": secret,
      },
      body: JSON.stringify({ question_ids: questionIds, langs: ["en", "hi"] }),
    });
  } catch (error) {
    console.error("Network error during audio generation fetch:", error);
    throw new Error(
      `Audio generation failed: Network error - ${error instanceof Error ? error.message : String(error)}`
    );
  }

  if (!response.ok) {
    let errorText = "";
    try {
      errorText = await response.text();
    } catch (e) {
      errorText = "Could not parse response body";
    }
    throw new Error(`Audio generation failed: API returned status ${response.status} - ${errorText}`);
  }
}

export async function sendToFinalInterviewAction(applicationId: string): Promise<Application> {
  const { orgId } = await requireOrgRole(ORG_PIPELINE_ROLES);
  const application = await updateApplicationStatusInDb(applicationId, "partner_review", orgId);
  await notifyCandidateStatus(application);
  return application;
}

export async function markCandidateHiredAction(applicationId: string): Promise<Application> {
  const { orgId } = await requireOrgRole(ORG_PIPELINE_ROLES);
  const application = await updateApplicationStatusInDb(applicationId, "hired", orgId);
  await notifyCandidateStatus(application);
  return application;
}

export async function rejectCandidateFinalAction(applicationId: string): Promise<Application> {
  const { orgId } = await requireOrgRole(ORG_PIPELINE_ROLES);
  const application = await updateApplicationStatusInDb(applicationId, "rejected_final", orgId);
  await notifyCandidateStatus(application);
  return application;
}

async function notifyCandidateStatus(application: Application): Promise<void> {
  if (!isEmailConfigured()) return;

  const supabase = createAdminClient();
  const [{ data: candidate }, { data: job }] = await Promise.all([
    supabase.from("candidates").select("name, email").eq("id", application.candidateId).single(),
    supabase.from("job_roles").select("title").eq("id", application.jobRoleId).single(),
  ]);

  if (!candidate?.email || !job?.title) return;

  try {
    await sendApplicationStatusEmail({
      to: candidate.email,
      candidateName: candidate.name,
      jobTitle: job.title,
      status: application.status,
    });
  } catch {
    // Pipeline transition should not fail if notification delivery is unavailable.
  }
}

const PIPELINE_TRANSITION_TARGETS: ApplicationStatus[] = [
  "interview_sent",
  "partner_review",
  "hired",
  "rejected_final",
  "interview_expired",
];

export async function transitionApplicationStageAction(input: {
  applicationId: string;
  status: ApplicationStatus;
  reason?: string;
}): Promise<Application> {
  if (!PIPELINE_TRANSITION_TARGETS.includes(input.status)) {
    throw new Error("This transition is not available from the admin pipeline.");
  }

  const { orgId } = await requireOrgRole(ORG_PIPELINE_ROLES);
  const supabase = createAdminClient();
  const { data: before } = await supabase
    .from("applications")
    .select("status, current_stage_id")
    .eq("id", input.applicationId)
    .single();

  const application = await updateApplicationStatusInDb(input.applicationId, input.status, orgId);
  const profile = await getCurrentProfileAction();

  try {
    await supabase.from("application_stage_history").insert({
      id: generateId("hist"),
      application_id: application.id,
      from_stage_id: before?.current_stage_id ?? null,
      to_stage_id: null,
      from_status: before?.status ?? null,
      to_status: input.status,
      actor_id: profile?.id ?? null,
      reason: input.reason ?? null,
      metadata: {},
      created_at: new Date().toISOString(),
    });

    await supabase.from("activity_log").insert({
      id: generateId("act"),
      org_id: orgId,
      actor_id: profile?.id ?? null,
      entity_type: "application",
      entity_id: application.id,
      action: "application.transitioned",
      metadata: {
        fromStatus: before?.status ?? null,
        toStatus: input.status,
        reason: input.reason ?? null,
      },
      created_at: new Date().toISOString(),
    });
  } catch {
    // Backward-compatible until enterprise workflow migration is applied.
  }

  await notifyCandidateStatus(application);
  return application;
}

export async function submitScorecardAction(input: {
  applicationId: string;
  recommendation: "strong_yes" | "yes" | "hold" | "no" | "strong_no";
  overallScore?: number | null;
  notes?: string;
}): Promise<{ ok?: boolean; error?: string }> {
  const { orgId } = await requireOrgRole([
    ...ORG_PIPELINE_ROLES,
    "interviewer",
    "final_interviewer",
  ]);
  const profile = await getCurrentProfileAction();
  if (!profile) return { error: "Not signed in" };

  const supabase = createAdminClient();
  const { data: app } = await supabase
    .from("applications")
    .select("id, job_role_id")
    .eq("id", input.applicationId)
    .single();
  if (!app) return { error: "Application not found" };

  const { data: job } = await supabase
    .from("job_roles")
    .select("org_id")
    .eq("id", app.job_role_id)
    .single();
  if (job?.org_id !== orgId) return { error: "Access denied" };

  const { error } = await supabase.from("scorecards").insert({
    id: generateId("scorecard"),
    application_id: input.applicationId,
    reviewer_id: profile.id,
    recommendation: input.recommendation,
    overall_score: input.overallScore ?? null,
    notes: input.notes?.trim() || null,
    submitted_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (error) return { error: error.message };
  return { ok: true };
}

export async function regenerateAndSendInterviewLinkAction(
  applicationId: string
): Promise<Application> {
  const { orgId } = await requireOrgRole(ORG_PIPELINE_ROLES);

  const supabase = createAdminClient();
  const { data: appRow, error } = await supabase
    .from("applications")
    .select("*")
    .eq("id", applicationId)
    .single();
  if (error || !appRow) throw new Error("Application not found");

  const current = mapApplication(appRow);

  if (!canRegenerateInterviewLink(current)) {
    throw new Error(
      "A new link can only be sent when the previous link expired or the candidate has not started the interview."
    );
  }

  const { application, candidate, job } = await regenerateInterviewLinkInDb(applicationId, orgId);

  if (!application.interviewToken || !application.tokenExpiresAt) {
    throw new Error("Failed to generate interview link");
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  await sendInterviewLinkEmail({
    to: candidate.email,
    candidateName: candidate.name,
    jobTitle: job.title,
    interviewUrl: `${appUrl}/candidate/${application.interviewToken}`,
    expiresAt: application.tokenExpiresAt,
  });

  return application;
}

export async function updateOrganizationAction(
  patch: Partial<
    Pick<Organization, "name" | "logoUrl" | "primaryColor" | "introVideoUrl" | "website" | "about">
  >
): Promise<Organization> {
  const { orgId } = await requireOrgRole(ORG_MANAGER_ROLES);
  return updateOrganizationInDb(orgId, patch);
}

export async function submitApplicationAction(
  jobId: string,
  formData: FormData
): Promise<{ application: Application; candidate: Candidate; eligibilityPassed: boolean }> {
  if (!isSupabaseServerEnabled()) {
    throw new Error("Supabase is not configured.");
  }

  const profile = await getCurrentProfileAction();
  const profileId = profile?.accountType === "candidate" ? profile.id : undefined;

  const supabase = createAdminClient();
  const { data: jobRow, error: jobError } = await supabase
    .from("job_roles")
    .select("*")
    .eq("id", jobId)
    .single();

  if (jobError) throw new Error(jobError.message);
  const job = mapJobRole(jobRow);

  const applicationId = generateId("app");
  const formResponse: Record<string, FormResponseValue> = {};

  for (const field of job.formFields) {
    const raw = formData.get(field.fieldKey);
    if (raw === null || raw === "") {
      if (field.required) throw new Error(`${field.label} is required`);
      continue;
    }

    if (isDocumentFieldType(field.type)) {
      if (!(raw instanceof File)) throw new Error(`Invalid file for ${field.label}`);
      if (raw.size === 0) {
        if (field.required) throw new Error(`${field.label} is required`);
        continue;
      }
      const doc = await uploadApplicationDocument(supabase, {
        orgId: job.orgId,
        jobId,
        applicationId,
        fieldKey: field.fieldKey,
        file: raw,
      });
      formResponse[field.fieldKey] = doc;
    } else if (field.type === "number") {
      formResponse[field.fieldKey] = Number(raw);
    } else {
      formResponse[field.fieldKey] = String(raw);
    }
  }

  const result = await submitApplicationInDb(jobId, formResponse, profileId, applicationId);

  if (
    result.application.status === "interview_sent" &&
    result.application.interviewToken &&
    result.application.tokenExpiresAt &&
    isEmailConfigured()
  ) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    try {
      await sendInterviewLinkEmail({
        to: result.candidate.email,
        candidateName: result.candidate.name,
        jobTitle: job.title,
        interviewUrl: `${appUrl}/candidate/${result.application.interviewToken}`,
        expiresAt: result.application.tokenExpiresAt,
      });
    } catch {
      // Application succeeds even if email fails; admin can resend from dashboard.
    }
  }

  return result;
}

async function verifySessionOrgAccess(
  sessionId: string,
  orgId: string
): Promise<boolean> {
  const supabase = createAdminClient();
  const { data: session } = await supabase
    .from("interview_sessions")
    .select("application_id")
    .eq("id", sessionId)
    .maybeSingle();
  if (!session) return false;

  const { data: app } = await supabase
    .from("applications")
    .select("job_role_id")
    .eq("id", session.application_id)
    .maybeSingle();
  if (!app) return false;

  const { data: job } = await supabase
    .from("job_roles")
    .select("org_id")
    .eq("id", app.job_role_id)
    .maybeSingle();

  return job?.org_id === orgId;
}

export async function getProctoringSnapshotUrlAction(
  sessionId: string,
  snapshotPath: string
): Promise<{ url?: string; error?: string }> {
  const orgId = await getAdminOrgIdAction();
  if (!orgId) return { error: "Unauthorized" };
  if (!snapshotPath.startsWith(`${sessionId}/`)) return { error: "Access denied" };

  const allowed = await verifySessionOrgAccess(sessionId, orgId);
  if (!allowed) return { error: "Access denied" };

  try {
    const supabase = createAdminClient();
    const url = await createProctoringSnapshotSignedUrl(supabase, snapshotPath);
    return { url };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not load snapshot" };
  }
}

export async function getProctoringSnapshotUrlsAction(
  sessionId: string,
  snapshotPaths: string[]
): Promise<Record<string, string>> {
  const orgId = await getAdminOrgIdAction();
  if (!orgId) return {};

  const validPaths = snapshotPaths.filter((p) => p.startsWith(`${sessionId}/`));
  if (validPaths.length === 0) return {};

  const allowed = await verifySessionOrgAccess(sessionId, orgId);
  if (!allowed) return {};

  const supabase = createAdminClient();
  const entries = await Promise.all(
    validPaths.map(async (path) => {
      try {
        const url = await createProctoringSnapshotSignedUrl(supabase, path);
        return [path, url] as const;
      } catch {
        return null;
      }
    })
  );

  return Object.fromEntries(entries.filter(Boolean) as [string, string][]);
}

export async function getApplicationDocumentUrlAction(
  storagePath: string
): Promise<{ url?: string; error?: string }> {
  const orgId = await getAdminOrgIdAction();
  if (!orgId) return { error: "Unauthorized" };

  if (!storagePath.startsWith(`${orgId}/`)) {
    return { error: "Access denied" };
  }

  try {
    const supabase = createAdminClient();
    const url = await createApplicationDocumentSignedUrl(supabase, storagePath);
    return { url };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not open document" };
  }
}

/** @deprecated Use FormData submission via submitApplicationAction */
export async function submitApplicationLegacyAction(
  jobId: string,
  formResponse: Record<string, string | number>
): Promise<{ application: Application; candidate: Candidate; eligibilityPassed: boolean }> {
  const profile = await getCurrentProfileAction();
  const profileId = profile?.accountType === "candidate" ? profile.id : undefined;
  return submitApplicationInDb(jobId, formResponse, profileId);
}

export { isApplicationDocument };
