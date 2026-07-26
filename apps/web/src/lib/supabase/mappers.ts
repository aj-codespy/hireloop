import type {
  AccountType,
  Application,
  ApplicationFormField,
  ApplicationStatus,
  Candidate,
  EligibilityRule,
  FormResponseValue,
  InterviewSession,
  JobRole,
  JobStatus,
  Organization,
  OrganizationMember,
  OrgMemberRole,
  Profile,
  Question,
  QuestionSection,
  Scorecard,
  TranscriptEntry,
} from "@/lib/types";

export interface OrganizationRow {
  id: string;
  name: string;
  logo_url: string | null;
  primary_color: string;
  intro_video_url: string | null;
  website: string | null;
  about: string | null;
  created_at: string;
}

export interface JobRoleRow {
  id: string;
  org_id: string;
  title: string;
  description: string;
  status: JobStatus;
  eligibility_rules: EligibilityRule[];
  passing_score: number | null;
  form_fields: ApplicationFormField[];
  interview_question_count: number | null;
  created_at: string;
  updated_at: string;
}

export interface QuestionRow {
  id: string;
  question_bank_id: string;
  job_role_id: string;
  section: QuestionSection;
  prompt_text: string;
  ideal_answer_notes: string;
  time_limit_seconds: number | null;
  score_threshold: number | null;
  order_index: number;
  is_active: boolean;
  is_mandatory: boolean;
  created_at: string;
}

export interface ProfileRow {
  id: string;
  account_type: AccountType;
  email: string;
  full_name: string;
  phone: string | null;
  resume_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMemberRow {
  id: string;
  org_id: string;
  user_id: string;
  role: OrgMemberRole;
  created_at: string;
}

export interface CandidateRow {
  id: string;
  org_id: string | null;
  profile_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  resume_url: string | null;
  source: string;
  created_at: string;
}

export interface ApplicationRow {
  id: string;
  candidate_id: string;
  job_role_id: string;
  form_response: Record<string, FormResponseValue>;
  status: ApplicationStatus;
  interview_token: string | null;
  token_expires_at: string | null;
  created_at: string;
}

export interface InterviewSessionRow {
  id: string;
  application_id: string;
  started_at: string | null;
  ended_at: string | null;
  status: InterviewSession["status"];
  total_duration_seconds: number | null;
  transcript: TranscriptEntry[] | null;
  question_scores: InterviewSession["questionScores"] | null;
  overall_score: InterviewSession["overallScore"] | null;
  proctoring_log: InterviewSession["proctoringLog"] | null;
  proctoring_summary: InterviewSession["proctoringSummary"] | null;
  created_at: string;
}

export interface ScorecardRow {
  id: string;
  application_id: string;
  reviewer_id: string;
  recommendation: Scorecard["recommendation"];
  overall_score: number | null;
  competencies: Record<string, number> | null;
  notes: string | null;
  submitted_at: string;
  created_at: string;
  updated_at: string;
}

export function mapOrganization(row: OrganizationRow): Organization {
  return {
    id: row.id,
    name: row.name,
    logoUrl: row.logo_url ?? undefined,
    primaryColor: row.primary_color,
    introVideoUrl: row.intro_video_url ?? undefined,
    website: row.website ?? undefined,
    about: row.about ?? undefined,
  };
}

export function mapJobRole(row: JobRoleRow): JobRole {
  return {
    id: row.id,
    orgId: row.org_id,
    title: row.title,
    description: row.description,
    status: row.status,
    eligibilityRules: row.eligibility_rules ?? [],
    passingScore: row.passing_score,
    interviewQuestionCount: row.interview_question_count,
    formFields: row.form_fields ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapQuestion(row: QuestionRow): Question {
  return {
    id: row.id,
    questionBankId: row.question_bank_id,
    jobRoleId: row.job_role_id,
    section: row.section,
    promptText: row.prompt_text,
    idealAnswerNotes: row.ideal_answer_notes,
    timeLimitSeconds: row.time_limit_seconds,
    scoreThreshold: row.score_threshold,
    order: row.order_index,
    isActive: row.is_active,
    isMandatory: row.is_mandatory,
  };
}

export function mapProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    accountType: row.account_type,
    email: row.email,
    fullName: row.full_name,
    phone: row.phone ?? undefined,
    resumeUrl: row.resume_url ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapOrganizationMember(row: OrganizationMemberRow): OrganizationMember {
  return {
    id: row.id,
    orgId: row.org_id,
    userId: row.user_id,
    role: row.role,
    createdAt: row.created_at,
  };
}

export function mapCandidate(row: CandidateRow): Candidate {
  return {
    id: row.id,
    orgId: row.org_id ?? undefined,
    profileId: row.profile_id ?? undefined,
    name: row.name,
    email: row.email,
    phone: row.phone ?? undefined,
    resumeUrl: row.resume_url ?? undefined,
    source: row.source,
    createdAt: row.created_at,
  };
}

export function mapApplication(row: ApplicationRow): Application {
  return {
    id: row.id,
    candidateId: row.candidate_id,
    jobRoleId: row.job_role_id,
    formResponse: row.form_response ?? {},
    status: row.status,
    interviewToken: row.interview_token ?? undefined,
    tokenExpiresAt: row.token_expires_at ?? undefined,
    createdAt: row.created_at,
  };
}

export function mapInterviewSession(row: InterviewSessionRow): InterviewSession {
  return {
    id: row.id,
    applicationId: row.application_id,
    startedAt: row.started_at ?? undefined,
    endedAt: row.ended_at ?? undefined,
    status: row.status,
    totalDurationSeconds: row.total_duration_seconds ?? undefined,
    transcript: row.transcript ?? undefined,
    questionScores: row.question_scores ?? undefined,
    overallScore: row.overall_score ?? undefined,
    proctoringLog: row.proctoring_log ?? undefined,
    proctoringSummary: row.proctoring_summary ?? undefined,
  };
}

export function mapScorecard(row: ScorecardRow): Scorecard {
  return {
    id: row.id,
    applicationId: row.application_id,
    reviewerId: row.reviewer_id,
    recommendation: row.recommendation,
    overallScore: row.overall_score,
    competencies: row.competencies ?? {},
    notes: row.notes,
    submittedAt: row.submitted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function questionInputToRow(
  jobId: string,
  q: {
    id: string;
    section: QuestionSection;
    promptText: string;
    idealAnswerNotes: string;
    timeLimitSeconds: number | null;
    scoreThreshold: number | null;
    isActive: boolean;
    isMandatory: boolean;
    order: number;
  }
): QuestionRow {
  return {
    id: q.id,
    question_bank_id: `bank-${q.section}`,
    job_role_id: jobId,
    section: q.section,
    prompt_text: q.promptText,
    ideal_answer_notes: q.idealAnswerNotes,
    time_limit_seconds: q.timeLimitSeconds,
    score_threshold: q.scoreThreshold,
    order_index: q.order,
    is_active: q.isActive,
    is_mandatory: q.isMandatory,
    created_at: new Date().toISOString(),
  };
}
