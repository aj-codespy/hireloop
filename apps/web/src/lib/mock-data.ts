import type {
  Application,
  Candidate,
  FunnelStats,
  InterviewSession,
  JobRole,
  Organization,
  Question,
  Scorecard,
  TranscriptEntry,
} from "./types";

/** Seed-only shape — seed.ts adds updatedAt */
type SeedJob = Omit<JobRole, "updatedAt">;
type SeedQuestion = Omit<Question, "scoreThreshold" | "timeLimitSeconds"> & {
  timeLimitSeconds: number;
  scoreThreshold?: null;
};

export const organization: Organization = {
  id: "org-1",
  name: "Summit Finance Partners",
  primaryColor: "#FF6B00",
  introVideoUrl: "https://www.youtube.com/embed/VCPGMjCW0is",
};

export const jobs: SeedJob[] = [
  {
    id: "job-1",
    orgId: "org-1",
    title: "Graduate Accountant &mdash; Audit Track",
    description:
      "Entry-level role for CA-intermediate candidates joining our audit practice. Strong reconciliation skills and client communication expected.",
    status: "live",
    passingScore: 7.0,
    interviewQuestionCount: 5,
    eligibilityRules: [
      { fieldKey: "ca_attempt", label: "CA attempts", operator: "<=", value: 2 },
      { fieldKey: "grad_score", label: "Graduation %", operator: ">=", value: 60 },
    ],
    formFields: [
      { id: "f1", fieldKey: "name", label: "Full name", type: "text", required: true, order: 1 },
      { id: "f2", fieldKey: "email", label: "Email", type: "email", required: true, order: 2 },
      { id: "f3", fieldKey: "phone", label: "Phone", type: "phone", required: true, order: 3 },
      { id: "f4", fieldKey: "ca_attempt", label: "CA attempts so far", type: "number", required: true, order: 4 },
      { id: "f5", fieldKey: "grad_score", label: "Graduation score (%)", type: "number", required: true, order: 5 },
      { id: "f6", fieldKey: "resume", label: "Resume", type: "doc", required: true, order: 6 },
    ],
    createdAt: "2026-06-01T10:00:00Z",
  },
  {
    id: "job-2",
    orgId: "org-1",
    title: "Financial Analyst &mdash; FP&A",
    description: "Support monthly forecasting, variance analysis, and board reporting for portfolio companies.",
    status: "draft",
    passingScore: 7.5,
    interviewQuestionCount: null,
    eligibilityRules: [
      { fieldKey: "grad_score", label: "Graduation %", operator: ">=", value: 65 },
    ],
    formFields: [
      { id: "g1", fieldKey: "name", label: "Full name", type: "text", required: true, order: 1 },
      { id: "g2", fieldKey: "email", label: "Email", type: "email", required: true, order: 2 },
      { id: "g3", fieldKey: "grad_score", label: "Graduation score (%)", type: "number", required: true, order: 3 },
    ],
    createdAt: "2026-06-15T10:00:00Z",
  },
  {
    id: "job-3",
    orgId: "org-1",
    title: "UX Researcher",
    description: "Lead user research for our digital banking products. Conduct interviews, usability tests, and synthesize insights for product teams.",
    status: "live",
    passingScore: 7.0,
    interviewQuestionCount: null,
    eligibilityRules: [],
    formFields: [
      { id: "u1", fieldKey: "name", label: "Full name", type: "text", required: true, order: 1 },
      { id: "u2", fieldKey: "email", label: "Email", type: "email", required: true, order: 2 },
    ],
    createdAt: "2026-05-20T10:00:00Z",
  },
  {
    id: "job-4",
    orgId: "org-1",
    title: "Senior Product Designer",
    description: "Own end-to-end design for enterprise finance workflows.",
    status: "live",
    passingScore: 7.5,
    interviewQuestionCount: null,
    eligibilityRules: [],
    formFields: [],
    createdAt: "2026-05-10T10:00:00Z",
  },
];

export const questions: SeedQuestion[] = [
  {
    id: "q1",
    questionBankId: "bank-tech",
    jobRoleId: "job-1",
    section: "technical",
    promptText:
      "Walk me through how you would reconcile a bank statement against a general ledger.",
    idealAnswerNotes: "Matching, unmatched items, timing differences, escalation.",
    timeLimitSeconds: 90,
    order: 1,
    isActive: true,
    isMandatory: true,
  },
  {
    id: "q2",
    questionBankId: "bank-tech",
    jobRoleId: "job-1",
    section: "technical",
    promptText: "How do you assess materiality when you find a discrepancy during an audit?",
    idealAnswerNotes: "Quantitative thresholds, qualitative factors, documentation.",
    timeLimitSeconds: 75,
    order: 2,
    isActive: true,
    isMandatory: false,
  },
  {
    id: "q3",
    questionBankId: "bank-sit",
    jobRoleId: "job-1",
    section: "situational",
    promptText: "Tell me about a time you met a tight deadline while maintaining accuracy.",
    idealAnswerNotes: "STAR format, prioritization, quality controls.",
    timeLimitSeconds: 75,
    order: 3,
    isActive: true,
    isMandatory: true,
  },
  {
    id: "q4",
    questionBankId: "bank-sit",
    jobRoleId: "job-1",
    section: "situational",
    promptText: "Describe a situation where you had to push back on a senior colleague.",
    idealAnswerNotes: "Respectful disagreement, evidence-based reasoning.",
    timeLimitSeconds: 75,
    order: 4,
    isActive: true,
    isMandatory: false,
  },
  {
    id: "q5",
    questionBankId: "bank-hr",
    jobRoleId: "job-1",
    section: "hr",
    promptText: "Why this role, and what do you hope to learn in your first six months?",
    idealAnswerNotes: "Genuine motivation, realistic learning goals.",
    timeLimitSeconds: 60,
    order: 5,
    isActive: true,
    isMandatory: true,
  },
];

export const candidates: Candidate[] = [
  {
    id: "cand-1",
    orgId: "org-1",
    name: "Priya Sharma",
    email: "priya@example.com",
    phone: "+91 98765 43210",
    source: "campus",
    createdAt: "2026-06-20T08:00:00Z",
  },
  {
    id: "cand-2",
    orgId: "org-1",
    name: "Arjun Mehta",
    email: "arjun@example.com",
    phone: "+91 91234 56789",
    source: "referral",
    createdAt: "2026-06-21T09:00:00Z",
  },
  {
    id: "cand-3",
    orgId: "org-1",
    name: "Sneha Reddy",
    email: "sneha@example.com",
    source: "linkedin",
    createdAt: "2026-06-22T10:00:00Z",
  },
  {
    id: "cand-4",
    orgId: "org-1",
    name: "Rahul Kapoor",
    email: "rahul@example.com",
    source: "campus",
    createdAt: "2026-06-23T11:00:00Z",
  },
  {
    id: "cand-5",
    orgId: "org-1",
    name: "Ananya Iyer",
    email: "ananya@example.com",
    source: "campus",
    createdAt: "2026-06-24T12:00:00Z",
  },
  {
    id: "cand-6",
    orgId: "org-1",
    name: "Emma Watson",
    email: "emma@example.com",
    phone: "+91 99887 76655",
    source: "linkedin",
    createdAt: "2026-07-01T08:00:00Z",
  },
];

export const applications: Application[] = [
  {
    id: "app-1",
    candidateId: "cand-1",
    jobRoleId: "job-1",
    formResponse: { ca_attempt: 1, grad_score: 72 },
    status: "partner_review",
    interviewToken: "demo-token-priya",
    tokenExpiresAt: "2026-07-10T00:00:00Z",
    createdAt: "2026-06-20T08:30:00Z",
  },
  {
    id: "app-2",
    candidateId: "cand-2",
    jobRoleId: "job-1",
    formResponse: { ca_attempt: 2, grad_score: 68 },
    status: "passed_ai",
    interviewToken: "demo-token-arjun",
    createdAt: "2026-06-21T09:30:00Z",
  },
  {
    id: "app-3",
    candidateId: "cand-3",
    jobRoleId: "job-1",
    formResponse: { ca_attempt: 1, grad_score: 55 },
    status: "auto_rejected",
    createdAt: "2026-06-22T10:30:00Z",
  },
  {
    id: "app-4",
    candidateId: "cand-4",
    jobRoleId: "job-1",
    formResponse: { ca_attempt: 1, grad_score: 74 },
    status: "interview_sent",
    interviewToken: "demo-token-rahul",
    tokenExpiresAt: "2026-07-08T00:00:00Z",
    createdAt: "2026-06-23T11:30:00Z",
  },
  {
    id: "app-5",
    candidateId: "cand-5",
    jobRoleId: "job-1",
    formResponse: { ca_attempt: 0, grad_score: 81 },
    status: "shortlisted",
    createdAt: "2026-06-24T12:30:00Z",
  },
];

export const interviewSessions: InterviewSession[] = [
  {
    id: "sess-1",
    applicationId: "app-1",
    startedAt: "2026-06-25T14:00:00Z",
    endedAt: "2026-06-25T14:22:00Z",
    status: "completed",
    totalDurationSeconds: 1320,
    questionScores: [
      {
        questionId: "q1",
        promptText: questions[0].promptText,
        score: 7.8,
        rationale: "Clear reconciliation steps; mentioned timing differences.",
        redFlags: [],
      },
      {
        questionId: "q3",
        promptText: questions[2].promptText,
        score: 8.2,
        rationale: "Strong STAR example with communication emphasis.",
        redFlags: [],
      },
      {
        questionId: "q5",
        promptText: questions[4].promptText,
        score: 7.5,
        rationale: "Aligned motivation with audit track.",
        redFlags: [],
      },
    ],
    overallScore: {
      totalScore: 7.8,
      pass: true,
      strengths: "Structured technical thinking, calm communication under pressure.",
      concerns: "Limited depth on materiality thresholds.",
      generatedAt: "2026-06-25T14:25:00Z",
    },
  },
  {
    id: "sess-2",
    applicationId: "app-2",
    startedAt: "2026-06-26T10:00:00Z",
    endedAt: "2026-06-26T10:19:00Z",
    status: "completed",
    totalDurationSeconds: 1140,
    overallScore: {
      totalScore: 7.2,
      pass: true,
      strengths: "Good situational examples.",
      concerns: "Technical answer lacked escalation path.",
      generatedAt: "2026-06-26T10:22:00Z",
    },
  },
];

export const demoTranscript: TranscriptEntry[] = [
  { speaker: "ai", text: "Hi Priya, thanks for joining. Let's start with your first question.", timestampOffsetSeconds: 0 },
  { speaker: "candidate", text: "Thank you, I'm ready.", timestampOffsetSeconds: 8 },
  { speaker: "ai", text: "Walk me through how you'd reconcile a bank statement against the general ledger.", timestampOffsetSeconds: 12 },
  { speaker: "candidate", text: "I'd start by matching cleared transactions, then investigate unmatched items...", timestampOffsetSeconds: 25 },
];

export const scorecards: Scorecard[] = [
  {
    id: "sc-1",
    applicationId: "app-1",
    reviewerId: "user-1",
    recommendation: "yes",
    overallScore: 8.5,
    competencies: { technical: 8, communication: 9, culture_fit: 8 },
    notes: "Strong technical foundation, excellent communication. Would recommend for final round.",
    submittedAt: "2026-06-26T10:00:00Z",
    createdAt: "2026-06-26T10:00:00Z",
    updatedAt: "2026-06-26T10:00:00Z",
  },
];

export const funnelStats: FunnelStats = {
  applied: 214,
  shortlisted: 128,
  interviewed: 87,
  passedAi: 42,
  partnerReview: 35,
  hired: 12,
};

export const jobStats: Record<string, { sourced: number; applied: number; interview: number; assessment: number; cleared: number }> = {
  "job-1": { sourced: 48, applied: 42, interview: 18, assessment: 12, cleared: 3 },
  "job-2": { sourced: 22, applied: 18, interview: 6, assessment: 4, cleared: 0 },
  "job-3": { sourced: 64, applied: 52, interview: 24, assessment: 14, cleared: 2 },
  "job-4": { sourced: 31, applied: 28, interview: 12, assessment: 8, cleared: 1 },
};

export const recentActivity = [
  { id: "a1", text: "Emma Watson applied for UX Researcher", time: "2 min ago", type: "apply" },
  { id: "a2", text: "Priya Sharma passed AI interview (7.8/10)", time: "15 min ago", type: "pass" },
  { id: "a4", text: "New job published: Senior Product Designer", time: "3 hrs ago", type: "job" },
  { id: "a5", text: "Rahul Kapoor moved to Interview stage", time: "5 hrs ago", type: "stage" },
];

export const hiringTeam = [
  { name: "Alex Johnson", role: "Hiring Manager", initials: "AJ" },
  { name: "Sarah Chen", role: "Recruiter", initials: "SC" },
  { name: "Mike Ross", role: "Partner", initials: "MR" },
];
