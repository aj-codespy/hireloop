import type { HireLoopState } from "@/lib/store/provider";
import { APPLICATION_STATUS_LABELS } from "@/lib/constants";

export interface CandidatesCsvOptions {
  /** Restrict to one job. */
  jobId?: string;
  /** Restrict to candidates who cleared all AI interviews. */
  onlyCleared?: boolean;
}

const HEADERS = [
  "Name",
  "Email",
  "Phone",
  "Job",
  "Status",
  "AI Score",
  "Interview done",
  "Applied at",
];

/** Quote a CSV field per RFC 4180: wrap in quotes, double inner quotes. */
function csvField(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function toCsvRow(values: (unknown)[]): string {
  return values.map(csvField).join(",");
}

/**
 * Build a CSV export of applicants for an org, optionally filtered by job
 * and/or to candidates who cleared all AI interviews.
 */
export function buildCandidatesCsv(state: HireLoopState, options: CandidatesCsvOptions = {}): string {
  const { jobId, onlyCleared } = options;
  const rows = [toCsvRow(HEADERS)];

  for (const application of state.applications) {
    if (jobId && application.jobRoleId !== jobId) continue;
    if (onlyCleared && application.status !== "cleared_interviews") continue;

    const candidate = state.candidates.find((c) => c.id === application.candidateId);
    const job = state.jobs.find((j) => j.id === application.jobRoleId);
    const session = state.interviewSessions.find((s) => s.applicationId === application.id);

    rows.push(
      toCsvRow([
        candidate?.name ?? "Unknown",
        candidate?.email ?? "",
        candidate?.phone ?? "",
        job?.title ?? "",
        APPLICATION_STATUS_LABELS[application.status] ?? application.status,
        session?.overallScore?.totalScore ?? "",
        session ? "Yes" : "",
        application.createdAt,
      ])
    );
  }

  return rows.join("\n") + "\n";
}
