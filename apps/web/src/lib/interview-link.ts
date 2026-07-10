import type { Application, ApplicationStatus } from "@/lib/types";

const BLOCKED_STATUSES: ApplicationStatus[] = [
  "interviewed",
  "passed_ai",
  "rejected_ai",
  "partner_review",
  "hired",
  "rejected_final",
  "auto_rejected",
];

function isTokenExpired(expiresAt?: string): boolean {
  if (!expiresAt) return true;
  return new Date(expiresAt) < new Date();
}

export function canRegenerateInterviewLink(application: Application): boolean {
  if (BLOCKED_STATUSES.includes(application.status)) return false;

  if (application.status === "interview_expired") return true;

  if (application.status === "interview_sent" && isTokenExpired(application.tokenExpiresAt)) {
    return true;
  }

  if (application.status === "shortlisted" && !application.interviewToken) {
    return true;
  }

  return false;
}
