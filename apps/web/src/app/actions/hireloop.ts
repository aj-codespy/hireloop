"use server";

import "server-only";
import { logger } from "@/lib/logger";

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
import { buildCandidatesCsv } from "@/lib/export/candidates-csv";
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

import { isRedirectError } from 'next/dist/client/components/redirect-error';
import { isHTTPAccessFallbackError as isNotFoundError } from 'next/dist/client/components/http-access-fallback/http-access-fallback';



export async function loadHireLoopStateAction(): Promise<HireLoopState | null | { ok: false; error: string }> {
  try {
    if (!isSupabaseServerEnabled()) return null;
    const profile = await getCurrentProfileAction();
    if (!profile || profile.accountType !== "org_admin") return null;
    const orgId = await getAdminOrgIdAction();
    if (!orgId) return null;
    return await fetchHireLoopState(orgId);
  } catch (err) {
    if (isRedirectError(err) || isNotFoundError(err)) throw err;
    return { ok: false, error: err instanceof Error ? err.message : "Failed to load global state" };
  }
}

export type CandidatePortalData = {
  applications: Application[];
  jobs: JobRole[];
};

export async function loadCandidatePortalDataAction(): Promise<CandidatePortalData | null | { ok: false; error: string }> {
  try {
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
  } catch (err) {
    if (isRedirectError(err) || isNotFoundError(err)) throw err;
    return { ok: false, error: err instanceof Error ? err.message : "Failed to load candidate portal data" };
  }
}

export async function loadInterviewByTokenAction(
  token: string
): Promise<InterviewTokenContext | null | { ok: false; error: string }> {
  try {
    if (!isSupabaseServerEnabled()) {
      return {
        ok: false,
        error:
          "Server database is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY on Vercel, then redeploy.",
      };
    }
    return await fetchInterviewContextByToken(token);
  } catch (err) {
    if (isRedirectError(err) || isNotFoundError(err)) throw err;
    return { ok: false, error: err instanceof Error ? err.message : "Failed to load interview context" };
  }
}

export async function loadPublicJobAction(jobId: string): Promise<{
  job: JobRole;
  organization: Organization;
} | null | { ok: false; error: string }> {
  try {
    if (!isSupabaseServerEnabled()) return null;

    const supabase = createAdminClient();
    const { data: jobRow, error: jobError } = await supabase
      .from("job_roles")
      .select("*")
      .eq("id", jobId)
      .maybeSingle();

    if (jobError) throw jobError;
    if (!jobRow) return null;
    const job = mapJobRole(jobRow);
    const { data: orgRow, error: orgError } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", job.orgId)
      .single();

    if (orgError) throw orgError;

    return {
      job,
      organization: orgRow ? mapOrganization(orgRow) : {
        id: job.orgId,
        name: "HireLoop",
        primaryColor: "#FF6B00",
      },
    };
  } catch (err) {
    if (isRedirectError(err) || isNotFoundError(err)) throw err;
    return { ok: false, error: err instanceof Error ? err.message : "Failed to load job details" };
  }
}

export async function loadPublicOrgJobsAction(orgId: string): Promise<{
  organization: Organization;
  jobs: JobRole[];
} | null | { ok: false; error: string }> {
  try {
    if (!isSupabaseServerEnabled()) return null;

    const supabase = createAdminClient();
    const [{ data: orgRow, error: orgError }, { data: jobRows, error: jobError }] = await Promise.all([
      supabase.from("organizations").select("*").eq("id", orgId).maybeSingle(),
      supabase
        .from("job_roles")
        .select("*")
        .eq("org_id", orgId)
        .eq("status", "live")
        .order("created_at", { ascending: false }),
    ]);

    if (orgError) throw orgError;
    if (jobError) throw jobError;
    if (!orgRow) return null;
    return {
      organization: mapOrganization(orgRow),
      jobs: (jobRows ?? []).map(mapJobRole),
    };
  } catch (err) {
    if (isRedirectError(err) || isNotFoundError(err)) throw err;
    return { ok: false, error: err instanceof Error ? err.message : "Failed to load organization jobs" };
  }
}
export async function getJobCloneDataAction(jobId: string): Promise<CreateJobInput | null | { ok: false; error: string }> {
  try {
    const { orgId } = await requireOrgRole(ORG_PIPELINE_ROLES);
    const supabase = createAdminClient();

    const { data: job } = await supabase
      .from("job_roles")
      .select("*")
      .eq("id", jobId)
      .eq("org_id", orgId)
      .single();

    if (!job) return null;

    const { data: jobRounds } = await supabase
      .from("job_rounds")
      .select("*")
      .eq("job_role_id", jobId)
      .order("order_index", { ascending: true });

    const { data: questions } = await supabase
      .from("questions")
      .select("*")
      .eq("job_role_id", jobId)
      .order("order_index", { ascending: true });

    const roundInputs: import("@/lib/store/provider").RoundInput[] = [];

    if (jobRounds && jobRounds.length > 0) {
      for (const round of jobRounds) {
        const roundQuestions = (questions || [])
          .filter((q) => q.round_id === round.id)
          .map((q) => ({
            id: generateId("q"),
            section: q.section,
            promptText: q.prompt_text,
            idealAnswerNotes: q.ideal_answer_notes,
            timeLimitSeconds: q.time_limit_seconds,
            scoreThreshold: q.score_threshold,
            isActive: q.is_active,
            isMandatory: q.is_mandatory,
          }));

        roundInputs.push({
          id: generateId("round"),
          title: round.title,
          interviewType: round.interview_type,
          passingScore: round.passing_score,
          interviewQuestionCount: null,
          questions: roundQuestions.length > 0 ? roundQuestions : [
            {
              section: "technical",
              promptText: "",
              idealAnswerNotes: "",
              timeLimitSeconds: null,
              scoreThreshold: null,
              isActive: true,
              isMandatory: false,
            }
          ],
        });
      }
    } else {
      // Legacy support: all questions in one ai round
      if (questions && questions.length > 0) {
        roundInputs.push({
          id: generateId("round"),
          title: "Round 1: AI Screen",
          interviewType: "ai",
          passingScore: null,
          interviewQuestionCount: null,
          questions: questions.map((q) => ({
            id: generateId("q"),
            section: q.section,
            promptText: q.prompt_text,
            idealAnswerNotes: q.ideal_answer_notes,
            timeLimitSeconds: q.time_limit_seconds,
            scoreThreshold: q.score_threshold,
            isActive: q.is_active,
            isMandatory: q.is_mandatory,
          }))
        });
      }
    }

    return {
      title: `${job.title} (Copy)`,
      description: job.description || "",
      status: "draft",
      formFields: Array.isArray(job.form_fields) ? job.form_fields.map((f: any) => ({
        id: generateId("f"),
        fieldKey: f.fieldKey,
        label: f.label,
        type: f.type,
        required: f.required,
        order: f.order,
        options: f.options,
      })) : [],
      eligibilityRules: Array.isArray(job.eligibility_rules) ? job.eligibility_rules : [],
      passingScore: job.passing_score,
      interviewQuestionCount: job.interview_question_count,
      rounds: roundInputs,
    };
  } catch (err) {
    if (isRedirectError(err) || isNotFoundError(err)) throw err;
    return { ok: false, error: err instanceof Error ? err.message : "Failed to load clone data" };
  }
}


export async function createJobAction(input: CreateJobInput): Promise<JobRole | { ok: false; error: string }> {
  try {
    const { orgId } = await requireOrgRole(ORG_MANAGER_ROLES);
    return await createJobInDb(orgId, input);
  } catch (err) {
    if (isRedirectError(err) || isNotFoundError(err)) throw err;
    return { ok: false, error: err instanceof Error ? err.message : "Failed to create job" };
  }
}

export async function updateJobAction(
  id: string,
  patch: Partial<JobRole>
): Promise<JobRole | { ok: false; error: string }> {
  try {
    await requireOrgRole(ORG_MANAGER_ROLES);
    return await updateJobInDb(id, patch);
  } catch (err) {
    if (isRedirectError(err) || isNotFoundError(err)) throw err;
    return { ok: false, error: err instanceof Error ? err.message : "Failed to update job" };
  }
}

export async function setJobQuestionsAction(
  jobId: string,
  questions: QuestionInput[],
  interviewQuestionCount?: number | null,
  rounds?: import("@/lib/store/provider").RoundInput[]
): Promise<void | { ok: false; error: string }> {
  try {
    await requireOrgRole(ORG_MANAGER_ROLES);
    await setJobQuestionsInDb(jobId, questions, interviewQuestionCount, rounds);

    const questionIds = questions.map((q) => q.id).filter(Boolean) as string[];
    if (rounds) {
      for (const round of rounds) {
        questionIds.push(...(round.questions.map((q) => q.id).filter(Boolean) as string[]));
      }
    }
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
      logger.error("Network error during audio generation fetch:", error);
      throw new Error(
        `Audio generation failed: Network error - ${error instanceof Error ? error.message : String(error)}`
      );
    }

    if (!response.ok) {
      let errorText = "";
      try {
        errorText = await response.text();
      } catch {
        errorText = "Could not parse response body";
      }
      logger.error(`Audio generation failed: API returned status ${response.status} - ${errorText}`);
      throw new Error(`Audio generation failed: API returned status ${response.status} - ${errorText}`);
    }

    logger.info(`Successfully triggered audio generation for ${questionIds.length} questions`);
  } catch (err) {
    if (isRedirectError(err) || isNotFoundError(err)) throw err;
    return { ok: false, error: err instanceof Error ? err.message : "Failed to set job questions" };
  }
}

export async function sendToFinalInterviewAction(applicationId: string): Promise<Application | { ok: false; error: string }> {
  try {
    const { orgId } = await requireOrgRole(ORG_PIPELINE_ROLES);
    const application = await updateApplicationStatusInDb(applicationId, "cleared_interviews", orgId);
    await notifyCandidateStatus(application);

    // Dispatch candidate.qualified webhook when candidate advances to final interview
    try {
      const supabase = createAdminClient();
      
      // Get application with candidate and job details
      const { data: appData, error: appErr } = await supabase
        .from("applications")
        .select("id, candidate_id, job_role_id, status")
        .eq("id", applicationId)
        .single();
      
      if (!appErr && appData) {
        // Get candidate info
        const { data: candidate } = await supabase
          .from("candidates")
          .select("id, name, email")
          .eq("id", appData.candidate_id)
          .single();
        
        // Get job info
        const { data: job } = await supabase
          .from("job_roles")
          .select("id, title, org_id")
          .eq("id", appData.job_role_id)
          .single();
        
        // Get AI interview score
        const { data: session } = await supabase
          .from("interview_sessions")
          .select("overall_score, proctoring_summary, cheating_probability")
          .eq("application_id", applicationId)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();
        
        // Get human scorecards (if any)
        const { data: scorecards } = await supabase
          .from("scorecards")
          .select("recommendation, overall_score, competencies, notes")
          .eq("application_id", applicationId);
        
        // Dispatch webhook
        const aiScore = session?.overall_score?.totalScore ?? 0;
        const proctoringSummary = session?.proctoring_summary ?? {};
        const proctoringFlagged = proctoringSummary.flagged === true;
        const cheatingProbability = session?.cheating_probability ?? 0;
        
        // Call the backend webhook dispatch via RPC
        const { data: rpcResult, error: rpcError } = await supabase.rpc(
          "dispatch_candidate_qualified_webhook",
          {
            p_application_id: applicationId,
            p_candidate_id: candidate?.id ?? "",
            p_job_id: job?.id ?? "",
            p_ai_score: aiScore,
            p_human_scorecards: scorecards ?? [],
            p_proctoring_flagged: proctoringFlagged,
            p_cheating_probability: cheatingProbability,
          }
        );
        
        if (rpcError) {
          console.warn("Failed to dispatch candidate.qualified webhook:", rpcError);
        }
      }
    } catch (webhookErr) {
      // Log but don't fail the transition
      console.warn("Webhook dispatch failed:", webhookErr);
    }

    return application;
  } catch (err) {
    if (isRedirectError(err) || isNotFoundError(err)) throw err;
    return { ok: false, error: err instanceof Error ? err.message : "Failed to transition to final interview" };
  }
}

async function notifyCandidateStatus(application: Application): Promise<void> {
  if (!isEmailConfigured()) return;

  try {
    const supabase = createAdminClient();
    const [{ data: candidate, error: candidateErr }, { data: job, error: jobErr }] = await Promise.all([
      supabase.from("candidates").select("name, email").eq("id", application.candidateId).single(),
      supabase.from("job_roles").select("title").eq("id", application.jobRoleId).single(),
    ]);

    if (candidateErr) throw candidateErr;
    if (jobErr) throw jobErr;

    if (!candidate?.email || !job?.title) return;

    await sendApplicationStatusEmail({
      to: candidate.email,
      candidateName: candidate.name,
      jobTitle: job.title,
      status: application.status,
    });
  } catch (err) {
    logger.error("Failed to notify candidate status", err);
  }
}

const PIPELINE_TRANSITION_TARGETS: ApplicationStatus[] = [
  "shortlisted",
  "interview_sent",
  "cleared_interviews",
  "interview_expired",
];

export async function transitionApplicationStageAction(input: {
  applicationId: string;
  status: ApplicationStatus;
  reason?: string;
}): Promise<Application | { ok: false; error: string }> {
  try {
    if (!PIPELINE_TRANSITION_TARGETS.includes(input.status)) {
      throw new Error("This transition is not available from the admin pipeline.");
    }

    const { orgId } = await requireOrgRole(ORG_PIPELINE_ROLES);
    const supabase = createAdminClient();
    const { data: before, error: beforeErr } = await supabase
      .from("applications")
      .select("status, current_stage_id")
      .eq("id", input.applicationId)
      .single();

    if (beforeErr) throw beforeErr;

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
    } catch (err) {
      logger.error("Failed to insert transition stage history/activity log", err);
    }

    await notifyCandidateStatus(application);
    return application;
  } catch (err) {
    if (isRedirectError(err) || isNotFoundError(err)) throw err;
    return { ok: false, error: err instanceof Error ? err.message : "Failed to transition application stage" };
  }
}

export async function submitScorecardAction(input: {
  applicationId: string;
  recommendation: "strong_yes" | "yes" | "hold" | "no" | "strong_no";
  overallScore?: number | null;
  notes?: string;
}): Promise<{ ok?: boolean; error?: string }> {
  try {
    const { orgId } = await requireOrgRole([
      ...ORG_PIPELINE_ROLES,
      "interviewer",
      "final_interviewer",
    ]);
    const profile = await getCurrentProfileAction();
    if (!profile) return { ok: false, error: "Not signed in" };

    const supabase = createAdminClient();
    const { data: app, error: appErr } = await supabase
      .from("applications")
      .select("id, job_role_id")
      .eq("id", input.applicationId)
      .single();
    if (appErr) throw appErr;
    if (!app) return { ok: false, error: "Application not found" };

    const { data: job, error: jobErr } = await supabase
      .from("job_roles")
      .select("org_id")
      .eq("id", app.job_role_id)
      .single();
    if (jobErr) throw jobErr;
    if (job?.org_id !== orgId) return { ok: false, error: "Access denied" };

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

    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    if (isRedirectError(err) || isNotFoundError(err)) throw err;
    return { ok: false, error: err instanceof Error ? err.message : "Failed to submit scorecard" };
  }
}

export async function regenerateAndSendInterviewLinkAction(
  applicationId: string
): Promise<Application | { ok: false; error: string }> {
  try {
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
  } catch (err) {
    if (isRedirectError(err) || isNotFoundError(err)) throw err;
    return { ok: false, error: err instanceof Error ? err.message : "Failed to regenerate and send interview link" };
  }
}

export async function updateOrganizationAction(
  patch: Partial<
    Pick<Organization, "name" | "logoUrl" | "primaryColor" | "introVideoUrl" | "website" | "about">
  >
): Promise<Organization | { ok: false; error: string }> {
  try {
    const { orgId } = await requireOrgRole(ORG_MANAGER_ROLES);
    return await updateOrganizationInDb(orgId, patch);
  } catch (err) {
    if (isRedirectError(err) || isNotFoundError(err)) throw err;
    return { ok: false, error: err instanceof Error ? err.message : "Failed to update organization profile" };
  }
}

export async function submitApplicationAction(
  jobId: string,
  formData: FormData
): Promise<{ application: Application; candidate: Candidate; eligibilityPassed: boolean } | { ok: false; error: string }> {
  try {
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
  } catch (err) {
    if (isRedirectError(err) || isNotFoundError(err)) throw err;
    return { ok: false, error: err instanceof Error ? err.message : "Failed to submit application" };
  }
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
  try {
    const orgId = await getAdminOrgIdAction();
    if (!orgId) return { error: "Unauthorized" };
    if (!snapshotPath.startsWith(`${sessionId}/`)) return { error: "Access denied" };

    const allowed = await verifySessionOrgAccess(sessionId, orgId);
    if (!allowed) return { error: "Access denied" };

    const supabase = createAdminClient();
    const url = await createProctoringSnapshotSignedUrl(supabase, snapshotPath);
    return { url };
  } catch (err) {
    if (isRedirectError(err) || isNotFoundError(err)) throw err;
    return { error: err instanceof Error ? err.message : "Could not load snapshot" };
  }
}

export async function getProctoringSnapshotUrlsAction(
  sessionId: string,
  snapshotPaths: string[]
): Promise<Record<string, string>> {
  try {
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
  } catch (err) {
    if (isRedirectError(err) || isNotFoundError(err)) throw err;
    return {};
  }
}

export async function getApplicationDocumentUrlAction(
  storagePath: string
): Promise<{ url?: string; error?: string }> {
  try {
    const orgId = await getAdminOrgIdAction();
    if (!orgId) return { error: "Unauthorized" };

    if (!storagePath.startsWith(`${orgId}/`)) {
      return { error: "Access denied" };
    }

    const supabase = createAdminClient();
    const url = await createApplicationDocumentSignedUrl(supabase, storagePath);
    return { url };
  } catch (err) {
    if (isRedirectError(err) || isNotFoundError(err)) throw err;
    return { error: err instanceof Error ? err.message : "Could not open document" };
  }
}

/** @deprecated Use FormData submission via submitApplicationAction */
export async function submitApplicationLegacyAction(
  jobId: string,
  formResponse: Record<string, string | number>
): Promise<{ application: Application; candidate: Candidate; eligibilityPassed: boolean } | { ok: false; error: string }> {
  try {
    const profile = await getCurrentProfileAction();
    const profileId = profile?.accountType === "candidate" ? profile.id : undefined;
    return await submitApplicationInDb(jobId, formResponse, profileId);
  } catch (err) {
    if (isRedirectError(err) || isNotFoundError(err)) throw err;
    return { ok: false, error: err instanceof Error ? err.message : "Failed to submit application" };
  }
}

export async function renderQuestionAudioAction(
  jobId: string,
  questionId: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const { orgId } = await requireOrgRole(ORG_MANAGER_ROLES);
    
    const supabase = createAdminClient();
    const { data: question, error: qErr } = await supabase
      .from("questions")
      .select("prompt_text, job_role_id")
      .eq("id", questionId)
      .single();
    
    if (qErr || !question) return { error: "Question not found" };
    if (question.job_role_id !== jobId) return { error: "Access denied" };
    
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
    const res = await fetch(`${apiUrl}/admin/questions/render-audio`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": process.env.INTERVIEW_INTERNAL_SECRET!,
      },
      body: JSON.stringify({ job_id: jobId, question_id: questionId }),
    });
    
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Failed to render audio" }));
      return { error: err.detail || "Failed to render audio" };
    }
    
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to render audio" };
  }
}

export { isApplicationDocument };

/**
 * Export applicants as CSV — org-scoped, server-side truth (not localStorage).
 * Returns the CSV string so the client can trigger a download.
 */
export async function exportCandidatesCsvAction(
  options: { jobId?: string; onlyCleared?: boolean } = {}
): Promise<{ csv: string; filename: string } | { ok: false; error: string }> {
  try {
    const { orgId } = await requireOrgRole(ORG_PIPELINE_ROLES);
    const state = await fetchHireLoopState(orgId);
    const csv = buildCandidatesCsv(state, options);
    const orgSlug = state.organization.name.toLowerCase().replace(/\s+/g, "-");
    const scope = options.onlyCleared ? "cleared" : "candidates";
    const filename = `hireloop-${orgSlug}-${scope}${options.jobId ? `-${options.jobId.slice(0, 8)}` : ""}.csv`;
    return { csv, filename };
  } catch (err) {
    if (isRedirectError(err) || isNotFoundError(err)) throw err;
    return { ok: false, error: err instanceof Error ? err.message : "Failed to export candidates" };
  }
}
