export type AccountType = "candidate" | "org_admin" | "partner";
export type OrgMemberRole =
  | "owner"
  | "admin"
  | "recruiter"
  | "hiring_manager"
  | "interviewer"
  | "coordinator"
  | "reporting_viewer"
  | "final_interviewer";

export interface Profile {
  id: string;
  accountType: AccountType;
  email: string;
  fullName: string;
  phone?: string;
  resumeUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationMember {
  id: string;
  orgId: string;
  userId: string;
  role: OrgMemberRole;
  createdAt: string;
}

export type JobStatus = "draft" | "live" | "closed";

export type ApplicationStatus =
  | "applied"
  | "auto_rejected"
  | "shortlisted"
  | "interview_sent"
  | "interviewed"
  | "interview_expired"
  | "passed_ai"
  | "rejected_ai"
  | "partner_review"
  | "hired"
  | "rejected_final";

export type QuestionSection = "technical" | "hr" | "situational";

export type FormFieldType = "text" | "number" | "email" | "phone" | "dropdown" | "doc" | "file";

/** Stored in applications.form_response for document upload fields */
export interface ApplicationDocument {
  originalName: string;
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
}

export type FormResponseValue = string | number | ApplicationDocument;

export interface Organization {
  id: string;
  name: string;
  logoUrl?: string;
  primaryColor: string;
  introVideoUrl?: string;
  website?: string;
  about?: string;
}

export interface EligibilityRule {
  fieldKey: string;
  operator: "<=" | ">=" | "=" | "<" | ">";
  value: string | number;
  label: string;
}

export interface ApplicationFormField {
  id: string;
  fieldKey: string;
  label: string;
  type: FormFieldType;
  required: boolean;
  order: number;
  options?: string[];
}

export interface JobRound {
  id: string;
  jobRoleId: string;
  title: string;
  orderIndex: number;
  passingScore: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface JobRole {
  id: string;
  orgId: string;
  title: string;
  description: string;
  status: JobStatus;
  eligibilityRules: EligibilityRule[];
  /** null = no passing-score gate configured */
  passingScore: number | null;
  /** null = ask all active questions; otherwise mandatory + random variable */
  interviewQuestionCount: number | null;
  formFields: ApplicationFormField[];
  createdAt: string;
  updatedAt: string;
}

export interface QuestionBank {
  id: string;
  jobRoleId: string;
  section: QuestionSection;
  isMandatory: boolean;
  weight: number;
}

export interface Question {
  id: string;
  questionBankId: string;
  jobRoleId: string;
  roundId?: string;
  section: QuestionSection;
  promptText: string;
  idealAnswerNotes: string;
  /** null = use platform default at interview time */
  timeLimitSeconds: number | null;
  order: number;
  isActive: boolean;
  /** When true, always included in every interview for this job */
  isMandatory: boolean;
  /** Optional per-question score threshold for flagging (not gating) */
  scoreThreshold: number | null;
}

export interface Candidate {
  id: string;
  /** @deprecated Org context comes from applications → jobs. Nullable for global identity. */
  orgId?: string;
  profileId?: string;
  name: string;
  email: string;
  phone?: string;
  resumeUrl?: string;
  source: string;
  createdAt: string;
}

export interface Application {
  id: string;
  candidateId: string;
  jobRoleId: string;
  currentRoundId?: string;
  formResponse: Record<string, FormResponseValue>;
  status: ApplicationStatus;
  interviewToken?: string;
  tokenExpiresAt?: string;
  createdAt: string;
}

export interface QuestionScore {
  questionId: string;
  promptText: string;
  score: number;
  rationale: string;
  redFlags: string[];
}

export interface OverallScore {
  totalScore: number;
  pass: boolean;
  strengths: string;
  concerns: string;
  generatedAt: string;
}

export interface ProctoringSummary {
  flagged?: boolean;
  reason?: string;
  reasons?: string[];
  warnings?: number;
  critical?: number;
}

export interface InterviewSession {
  id: string;
  applicationId: string;
  roundId?: string;
  startedAt?: string;
  endedAt?: string;
  status: "in_progress" | "completed" | "abandoned" | "flagged";
  totalDurationSeconds?: number;
  transcript?: TranscriptEntry[];
  questionScores?: QuestionScore[];
  overallScore?: OverallScore;
  proctoringLog?: ProctoringLogEntry[];
  proctoringSummary?: ProctoringSummary;
  cheating_probability?: number;
}

export interface ProctoringLogEntry {
  at: string;
  type: string;
  severity: "info" | "warning" | "critical";
  detail: string;
  questionIndex?: number;
  analysis?: Record<string, unknown>;
  snapshotPath?: string;
}

export interface TranscriptEntry {
  speaker: "ai" | "candidate";
  text: string;
  timestampOffsetSeconds: number;
  questionId?: string;
}

export interface FunnelStats {
  applied: number;
  shortlisted: number;
  interviewed: number;
  passedAi: number;
  partnerReview: number;
  hired: number;
}

export type ScorecardRecommendation =
  | "strong_yes"
  | "yes"
  | "hold"
  | "no"
  | "strong_no";

export interface Scorecard {
  id: string;
  applicationId: string;
  reviewerId: string;
  recommendation: ScorecardRecommendation;
  overallScore: number | null;
  competencies: Record<string, unknown>;
  notes: string | null;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
}
