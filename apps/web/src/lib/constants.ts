import type { ApplicationStatus } from "./types";

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  applied: "Applied",
  auto_rejected: "Auto-rejected",
  shortlisted: "Shortlisted",
  interview_sent: "Interview sent",
  interviewed: "Interviewed",
  interview_expired: "Interview expired",
  passed_ai: "Passed AI",
  rejected_ai: "Rejected (AI)",
  cleared_interviews: "Cleared interviews",
};

export const PIPELINE_COLUMNS: ApplicationStatus[] = [
  "applied",
  "shortlisted",
  "interview_sent",
  "interviewed",
  "passed_ai",
  "cleared_interviews",
];

export const STATUS_COLORS: Record<ApplicationStatus, string> = {
  applied: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  auto_rejected: "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300",
  shortlisted: "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
  interview_sent: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300",
  interviewed: "bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300",
  interview_expired: "bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300",
  passed_ai: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  rejected_ai: "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300",
  cleared_interviews: "bg-green-50 text-green-800 dark:bg-green-950/50 dark:text-green-300",
};

export const SECTION_LABELS = {
  technical: "Technical",
  hr: "HR",
  situational: "Situational",
} as const;
