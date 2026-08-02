import { evaluateEligibility } from "@/lib/eligibility";
import { sendInterviewExpiredEmail } from "@/lib/email/send-interview-expired";
import { isEmailConfigured } from "@/lib/email/send-interview-link";
import { generateId, generateInterviewToken } from "@/lib/id";
import { organization as defaultOrganization } from "@/lib/mock-data";
import type { HireLoopState } from "@/lib/store/provider";
import type { CreateJobInput, QuestionInput } from "@/lib/store/provider";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  mapApplication,
  mapCandidate,
  mapInterviewSession,
  mapJobRole,
  mapOrganization,
  mapQuestion,
  mapScorecard,
  questionInputToRow,
} from "@/lib/supabase/mappers";
import type {
  Application,
  ApplicationStatus,
  Candidate,
  FormResponseValue,
  JobRole,
  Organization,
  Scorecard,
} from "@/lib/types";

function db() {
  return createAdminClient();
}

export async function fetchHireLoopState(scopeOrgId?: string): Promise<HireLoopState> {
  const supabase = db();

  const [
    { data: orgRows, error: orgError },
    { data: jobRows, error: jobError },
    { data: questionRows, error: questionError },
    { data: candidateRows, error: candidateError },
    { data: applicationRows, error: applicationError },
    { data: sessionRows, error: sessionError },
    { data: scorecardRows, error: scorecardError },
  ] = await Promise.all([
    supabase.from("organizations").select("*").order("created_at", { ascending: true }),
    supabase.from("job_roles").select("*").order("created_at", { ascending: false }),
    supabase.from("questions").select("*").order("order_index", { ascending: true }),
    supabase.from("candidates").select("*").order("created_at", { ascending: false }),
    supabase.from("applications").select("*").order("created_at", { ascending: false }),
    supabase.from("interview_sessions").select("*").order("created_at", { ascending: false }),
    supabase.from("scorecards").select("*").order("submitted_at", { ascending: false }),
  ]);

  const error =
      orgError ??
      jobError ??
      questionError ??
      candidateError ??
      applicationError ??
      sessionError ??
      scorecardError;
  if (error) throw new Error(error.message);

  let organization =
    orgRows && orgRows.length > 0 ? mapOrganization(orgRows[0]) : defaultOrganization;

  if (scopeOrgId && orgRows) {
    const scoped = orgRows.find((o) => o.id === scopeOrgId);
    if (scoped) organization = mapOrganization(scoped);
  }

  if (!orgRows || orgRows.length === 0) {
    const { error: seedOrgError } = await supabase.from("organizations").insert({
      id: defaultOrganization.id,
      name: defaultOrganization.name,
      logo_url: defaultOrganization.logoUrl ?? null,
      primary_color: defaultOrganization.primaryColor,
      intro_video_url: defaultOrganization.introVideoUrl ?? null,
      created_at: new Date().toISOString(),
    });
    if (seedOrgError) throw new Error(seedOrgError.message);
    organization = defaultOrganization;
  }

  const jobs = (jobRows ?? []).map(mapJobRole);
  const scopedJobs = scopeOrgId ? jobs.filter((j) => j.orgId === scopeOrgId) : jobs;
  const scopedJobIds = new Set(scopedJobs.map((j) => j.id));

  const questions = (questionRows ?? [])
    .map(mapQuestion)
    .filter((q) => !scopeOrgId || scopedJobIds.has(q.jobRoleId));

  const applications = (applicationRows ?? [])
    .map(mapApplication)
    .filter((a) => !scopeOrgId || scopedJobIds.has(a.jobRoleId));

  const candidateIds = new Set(applications.map((a) => a.candidateId));
  const candidates = (candidateRows ?? [])
    .map(mapCandidate)
    .filter((c) => !scopeOrgId || candidateIds.has(c.id));

  const applicationIds = new Set(applications.map((a) => a.id));
  const interviewSessions = (sessionRows ?? [])
    .map(mapInterviewSession)
    .filter((s) => !scopeOrgId || applicationIds.has(s.applicationId));

  const scorecards = (scorecardRows ?? []).map(mapScorecard);

  return {
    organization,
    jobs: scopedJobs,
    questions,
    candidates,
    applications,
    interviewSessions,
    scorecards,
  };
}

export async function createJobInDb(
  orgId: string,
  input: CreateJobInput
): Promise<JobRole> {
  const supabase = db();
  const now = new Date().toISOString();
  const job: JobRole = {
    id: generateId("job"),
    orgId,
    title: input.title,
    description: input.description,
    status: input.status,
    eligibilityRules: input.eligibilityRules,
    passingScore: input.passingScore,
    interviewQuestionCount: input.interviewQuestionCount ?? null,
    formFields: input.formFields,
    createdAt: now,
    updatedAt: now,
  };

  const { error } = await supabase.from("job_roles").insert({
    id: job.id,
    org_id: job.orgId,
    title: job.title,
    description: job.description,
    status: job.status,
    eligibility_rules: job.eligibilityRules,
    passing_score: job.passingScore,
    interview_question_count: job.interviewQuestionCount,
    form_fields: job.formFields,
    created_at: job.createdAt,
    updated_at: job.updatedAt,
  });

  if (error) throw new Error(error.message);
  return job;
}

export async function updateJobInDb(
  id: string,
  patch: Partial<JobRole>,
  orgId: string
): Promise<JobRole> {
  const supabase = db();
  const { data: existing, error: fetchError } = await supabase
    .from("job_roles")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !existing) throw new Error(fetchError?.message ?? "Job not found");
  if (existing.org_id !== orgId) {
    throw new Error("Access denied");
  }

  const current = mapJobRole(existing);
  const updated: JobRole = {
    ...current,
    ...patch,
    updatedAt: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("job_roles")
    .update({
      title: updated.title,
      description: updated.description,
      status: updated.status,
      eligibility_rules: updated.eligibilityRules,
      passing_score: updated.passingScore,
      interview_question_count: updated.interviewQuestionCount,
      form_fields: updated.formFields,
      updated_at: updated.updatedAt,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  return updated;
}

export async function setJobQuestionsInDb(
  jobId: string,
  inputs: QuestionInput[],
  interviewQuestionCount?: number | null,
  rounds?: import("@/lib/store/provider").RoundInput[]
): Promise<void> {
  const supabase = db();
  const { error: deleteQuestionsError } = await supabase
    .from("questions")
    .delete()
    .eq("job_role_id", jobId);
  if (deleteQuestionsError) throw new Error(deleteQuestionsError.message);

  // We should also delete existing rounds for this job
  const { error: deleteRoundsError } = await supabase
    .from("job_rounds")
    .delete()
    .eq("job_role_id", jobId);
  if (deleteRoundsError) throw new Error(deleteRoundsError.message);

  if (inputs.length === 0 && (!rounds || rounds.length === 0)) return;

  const now = new Date().toISOString();
  let questionRowsToInsert: any[] = [];
  
  if (rounds && rounds.length > 0) {
    const roundRows = rounds.map((r, i) => ({
      id: r.id ?? generateId("round"),
      job_role_id: jobId,
      title: r.title,
      order_index: i,
      passing_score: r.passingScore,
      interview_type: r.interviewType || "ai",
      created_at: now,
      updated_at: now,
    }));
    const { error: insertRoundsError } = await supabase.from("job_rounds").insert(roundRows);
    if (insertRoundsError) throw new Error(insertRoundsError.message);

    rounds.forEach((r, roundIndex) => {
      const roundId = roundRows[roundIndex].id;
      const rows = r.questions.map((q, qIndex) => 
        questionInputToRow(jobId, {
          id: q.id ?? generateId("q"),
          section: q.section,
          promptText: q.promptText,
          idealAnswerNotes: q.idealAnswerNotes,
          timeLimitSeconds: q.timeLimitSeconds,
          scoreThreshold: q.scoreThreshold,
          isActive: q.isActive,
          isMandatory: q.isMandatory,
          order: qIndex + 1,
        })
      ).map(row => ({ ...row, round_id: roundId }));
      questionRowsToInsert.push(...rows);
    });
  } else {
    // Legacy support (no rounds)
    questionRowsToInsert = inputs.map((q, index) =>
      questionInputToRow(jobId, {
        id: q.id ?? generateId("q"),
        section: q.section,
        promptText: q.promptText,
        idealAnswerNotes: q.idealAnswerNotes,
        timeLimitSeconds: q.timeLimitSeconds,
        scoreThreshold: q.scoreThreshold,
        isActive: q.isActive,
        isMandatory: q.isMandatory,
        order: index + 1,
      })
    );
  }

  if (questionRowsToInsert.length > 0) {
    const { error: insertError } = await supabase.from("questions").insert(
      questionRowsToInsert.map((r) => ({
        id: r.id,
        question_bank_id: r.question_bank_id,
        job_role_id: r.job_role_id,
        round_id: r.round_id,
        section: r.section,
        prompt_text: r.prompt_text,
        ideal_answer_notes: r.ideal_answer_notes,
        time_limit_seconds: r.time_limit_seconds,
        score_threshold: r.score_threshold,
        order_index: r.order_index,
        is_active: r.is_active,
        is_mandatory: r.is_mandatory,
        created_at: r.created_at,
      }))
    );
    if (insertError) throw new Error(insertError.message);
  }

  if (interviewQuestionCount !== undefined) {
    const { error: jobError } = await supabase
      .from("job_roles")
      .update({
        interview_question_count: interviewQuestionCount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId);
    if (jobError) throw new Error(jobError.message);
  }
}

export async function submitApplicationInDb(
  jobId: string,
  formResponse: Record<string, FormResponseValue>,
  profileId?: string,
  applicationId?: string
): Promise<{ application: Application; candidate: Candidate; eligibilityPassed: boolean }> {
  const supabase = db();

  const { data: jobRow, error: jobError } = await supabase
    .from("job_roles")
    .select("*")
    .eq("id", jobId)
    .single();

  if (jobError) throw new Error(jobError.message);
  const job = mapJobRole(jobRow);

  const eligibility = evaluateEligibility(formResponse, job.eligibilityRules);
  const now = new Date().toISOString();

  const name = String(formResponse.name ?? formResponse.full_name ?? "Unknown candidate");
  const email = String(formResponse.email ?? "").trim().toLowerCase();
  const phone = formResponse.phone ? String(formResponse.phone) : undefined;

  if (!email) throw new Error("Email is required");

  const candidate = await findOrCreateCandidate(supabase, {
    name,
    email,
    phone,
    orgId: job.orgId,
    profileId,
  });

  const { data: existingApps, error: appQueryError } = await supabase
    .from("applications")
    .select("id")
    .eq("candidate_id", candidate.id)
    .eq("job_role_id", jobId)
    .limit(2);

  if (appQueryError) throw new Error(appQueryError.message);
  if (existingApps && existingApps.length > 0)
    throw new Error("You have already applied to this job");

  let status: ApplicationStatus = eligibility.passed ? "shortlisted" : "auto_rejected";
  let interviewToken: string | undefined;
  let tokenExpiresAt: string | undefined;

  if (status === "shortlisted") {
    status = "interview_sent";
    interviewToken = generateInterviewToken();
    const expires = new Date();
    expires.setHours(expires.getHours() + 72);
    tokenExpiresAt = expires.toISOString();
  }

  const application: Application = {
    id: applicationId ?? generateId("app"),
    candidateId: candidate.id,
    jobRoleId: jobId,
    formResponse,
    status,
    interviewToken,
    tokenExpiresAt,
    createdAt: now,
  };

  const { error: applicationError } = await supabase.from("applications").insert({
    id: application.id,
    candidate_id: application.candidateId,
    job_role_id: application.jobRoleId,
    form_response: application.formResponse,
    status: application.status,
    interview_token: application.interviewToken ?? null,
    token_expires_at: application.tokenExpiresAt ?? null,
    created_at: application.createdAt,
  });

  if (applicationError) throw new Error(applicationError.message);

  return { application, candidate, eligibilityPassed: eligibility.passed };
}

async function findOrCreateCandidate(
  supabase: ReturnType<typeof createAdminClient>,
  input: {
    name: string;
    email: string;
    phone?: string;
    orgId: string;
    profileId?: string;
  }
): Promise<Candidate> {
  const { data: existingRows, error: findError } = await supabase
    .from("candidates")
    .select("*")
    .ilike("email", input.email)
    .eq("org_id", input.orgId)
    .order("created_at", { ascending: true })
    .limit(2);

  if (findError) throw new Error(findError.message);

  // Same email can exist as multiple rows (data drift). Scope by org and take
  // the earliest row deterministically instead of letting .maybeSingle() crash
  // with a raw "Cannot coerce" error.
  const existing = existingRows && existingRows.length > 0 ? existingRows[0] : null;

  if (existing) {
    const { data: updated, error: updateError } = await supabase
      .from("candidates")
      .update({
        name: input.name,
        phone: input.phone ?? existing.phone,
        profile_id: input.profileId ?? existing.profile_id,
      })
      .eq("id", existing.id)
      .select("*")
      .single();

    if (updateError) throw new Error(updateError.message);
    return mapCandidate(updated);
  }

  const now = new Date().toISOString();
  const candidate: Candidate = {
    id: generateId("cand"),
    orgId: input.orgId,
    profileId: input.profileId,
    name: input.name,
    email: input.email,
    phone: input.phone,
    source: "website",
    createdAt: now,
  };

  const { error: insertError } = await supabase.from("candidates").insert({
    id: candidate.id,
    org_id: candidate.orgId ?? null,
    profile_id: candidate.profileId ?? null,
    name: candidate.name,
    email: candidate.email,
    phone: candidate.phone ?? null,
    resume_url: candidate.resumeUrl ?? null,
    source: candidate.source,
    created_at: candidate.createdAt,
  });

  if (insertError) throw new Error(insertError.message);
  return candidate;
}

export interface InterviewTokenContext {
  application: Application;
  candidate: Candidate;
  job: JobRole;
  organization: ReturnType<typeof mapOrganization>;
}

export async function markInterviewExpiredAndNotify(
  applicationId: string,
  sessionId?: string
): Promise<void> {
  const supabase = db();

  const { data: appRow } = await supabase
    .from("applications")
    .select("status, candidate_id, job_role_id")
    .eq("id", applicationId)
    .maybeSingle();
  if (!appRow || appRow.status === "interview_expired") return;

  const now = new Date().toISOString();

  if (sessionId) {
    await supabase
      .from("interview_sessions")
      .update({ status: "abandoned", ended_at: now })
      .eq("id", sessionId);
  }

  await supabase
    .from("applications")
    .update({ status: "interview_expired" })
    .eq("id", applicationId);

  const [{ data: candRow }, { data: jobRow }] = await Promise.all([
    supabase.from("candidates").select("name, email").eq("id", appRow.candidate_id).single(),
    supabase.from("job_roles").select("title").eq("id", appRow.job_role_id).single(),
  ]);

  if (!candRow?.email || !jobRow?.title || !isEmailConfigured()) return;

  try {
    await sendInterviewExpiredEmail({
      to: candRow.email,
      candidateName: candRow.name,
      jobTitle: jobRow.title,
    });
  } catch {
    // Status is updated; email failure should not block the expired state.
  }
}

export async function fetchInterviewContextByToken(
  token: string
): Promise<InterviewTokenContext | null> {
  const supabase = db();

  const { data: appRows, error: appError } = await supabase
    .from("applications")
    .select("*")
    .eq("interview_token", token)
    .limit(2);

  if (appError) {
    throw appError;
  }
  if (!appRows || appRows.length === 0) return null;
  if (appRows.length > 1) {
    throw new Error(
      "This interview link is not valid. Please contact the hiring team for a new link."
    );
  }
  const appRow = appRows[0];

  const application = mapApplication(appRow);

  const { data: sessionRow, error: sessionError } = await supabase
    .from("interview_sessions")
    .select("id, reconnect_expires_at, status")
    .eq("application_id", application.id)
    .eq("status", "in_progress")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (sessionError) {
    throw sessionError;
  }

  const reconnectExpired =
    sessionRow?.reconnect_expires_at &&
    new Date(sessionRow.reconnect_expires_at) < new Date();

  const tokenExpired =
    application.tokenExpiresAt && new Date(application.tokenExpiresAt) < new Date();

  if (tokenExpired || reconnectExpired) {
    await markInterviewExpiredAndNotify(
      application.id,
      reconnectExpired && sessionRow ? sessionRow.id : undefined
    );
    return null;
  }

  if (application.status === "interview_expired") {
    return null;
  }

  const [{ data: candRow, error: candError }, { data: jobRow, error: jobError }] = await Promise.all([
    supabase.from("candidates").select("*").eq("id", application.candidateId).single(),
    supabase.from("job_roles").select("*").eq("id", application.jobRoleId).single(),
  ]);

  if (candError) {
    throw candError;
  }
  if (jobError) {
    throw jobError;
  }

  if (!candRow || !jobRow) return null;

  const job = mapJobRole(jobRow);
  const { data: orgRow, error: orgError } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", job.orgId)
    .single();

  if (orgError) {
    throw orgError;
  }

  return {
    application,
    candidate: mapCandidate(candRow),
    job,
    organization: orgRow ? mapOrganization(orgRow) : mapOrganization({
      id: job.orgId,
      name: "HireLoop",
      logo_url: null,
      primary_color: "#FF6B00",
      intro_video_url: null,
      website: null,
      about: null,
      created_at: new Date().toISOString(),
    }),
  };
}


export async function updateOrganizationInDb(
  orgId: string,
  patch: Partial<
    Pick<Organization, "name" | "logoUrl" | "primaryColor" | "introVideoUrl" | "website" | "about">
  >
): Promise<Organization> {
  const supabase = db();

  const row: Record<string, string | null> = {};
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.logoUrl !== undefined) row.logo_url = patch.logoUrl ?? null;
  if (patch.primaryColor !== undefined) row.primary_color = patch.primaryColor;
  if (patch.introVideoUrl !== undefined) row.intro_video_url = patch.introVideoUrl ?? null;
  if (patch.website !== undefined) row.website = patch.website ?? null;
  if (patch.about !== undefined) row.about = patch.about ?? null;

  if (Object.keys(row).length === 0) {
    const { data: existing, error: findError } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", orgId)
      .single();
    if (findError || !existing) throw new Error("Organization not found");
    return mapOrganization(existing);
  }

  const { data: updated, error } = await supabase
    .from("organizations")
    .update(row)
    .eq("id", orgId)
    .select("*")
    .single();

  if (error || !updated) throw new Error(error?.message ?? "Update failed");
  return mapOrganization(updated);
}

export async function regenerateInterviewLinkInDb(
  applicationId: string,
  orgId: string
): Promise<{ application: Application; candidate: Candidate; job: JobRole }> {
  const supabase = db();

  const { data: appRow, error: findError } = await supabase
    .from("applications")
    .select("*")
    .eq("id", applicationId)
    .single();
  if (findError || !appRow) throw new Error("Application not found");

  const application = mapApplication(appRow);

  const { data: jobRow, error: jobError } = await supabase
    .from("job_roles")
    .select("*")
    .eq("id", application.jobRoleId)
    .single();
  if (jobError || !jobRow || jobRow.org_id !== orgId) {
    throw new Error("Access denied");
  }

  const { data: candRow, error: candError } = await supabase
    .from("candidates")
    .select("*")
    .eq("id", application.candidateId)
    .single();
  if (candError || !candRow) throw new Error("Candidate not found");

  const interviewToken = generateInterviewToken();
  const expires = new Date();
  expires.setHours(expires.getHours() + 72);
  const tokenExpiresAt = expires.toISOString();

  const { data: updated, error: updateError } = await supabase
    .from("applications")
    .update({
      interview_token: interviewToken,
      token_expires_at: tokenExpiresAt,
      status: "interview_sent",
    })
    .eq("id", applicationId)
    .select("*")
    .single();

  if (updateError || !updated) throw new Error(updateError?.message ?? "Update failed");

  return {
    application: mapApplication(updated),
    candidate: mapCandidate(candRow),
    job: mapJobRole(jobRow),
  };
}

export async function updateApplicationStatusInDb(
  applicationId: string,
  status: ApplicationStatus,
  orgId: string
): Promise<Application> {
  const supabase = db();

  const { data: appRow, error: findError } = await supabase
    .from("applications")
    .select("*")
    .eq("id", applicationId)
    .single();
  if (findError || !appRow) throw new Error("Application not found");

  const { data: jobRow, error: jobError } = await supabase
    .from("job_roles")
    .select("org_id")
    .eq("id", appRow.job_role_id)
    .single();
  if (jobError || !jobRow || jobRow.org_id !== orgId) {
    throw new Error("Access denied");
  }

  const { data: updated, error: updateError } = await supabase
    .from("applications")
    .update({ status })
    .eq("id", applicationId)
    .select("*")
    .single();
  if (updateError) throw new Error(updateError.message);

  return mapApplication(updated);
}
