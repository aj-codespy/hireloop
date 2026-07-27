import {
  applications,
  candidates,
  funnelStats,
  interviewSessions,
  jobs,
  organization,
  questions,
  demoTranscript,
  jobStats,
  recentActivity,
  hiringTeam,
} from "@/lib/mock-data";
import type {
  Application,
  ApplicationStatus,
  Candidate,
  InterviewSession,
  JobRole,
  Organization,
  Question,
  TranscriptEntry,
} from "@/lib/types";

export function getOrganization(): Organization {
  return organization;
}

export function getJobs(): JobRole[] {
  return jobs.map((j) => ({ ...j, updatedAt: j.createdAt }));
}

export function getJob(id: string): JobRole | undefined {
  const j = jobs.find((job) => job.id === id);
  return j ? { ...j, updatedAt: j.createdAt } : undefined;
}

export function getLiveJobs(): JobRole[] {
  return getJobs().filter((j) => j.status === "live");
}

export function getQuestionsForJob(jobRoleId: string): Question[] {
  return questions
    .filter((q) => q.jobRoleId === jobRoleId)
    .map((q) => ({ ...q, timeLimitSeconds: q.timeLimitSeconds, scoreThreshold: null }))
    .sort((a, b) => a.order - b.order);
}

export function getCandidates(): Candidate[] {
  return candidates;
}

export function getCandidate(id: string): Candidate | undefined {
  return candidates.find((c) => c.id === id);
}

export function getApplications(): Application[] {
  return applications;
}

export function getApplicationsByStatus(status: ApplicationStatus): Application[] {
  return applications.filter((a) => a.status === status);
}

export function getApplication(id: string): Application | undefined {
  return applications.find((a) => a.id === id);
}

export function getApplicationByToken(token: string): Application | undefined {
  return applications.find((a) => a.interviewToken === token);
}

export function getApplicationsForJob(jobRoleId: string): Application[] {
  return applications.filter((a) => a.jobRoleId === jobRoleId);
}

export function getInterviewSession(applicationId: string): InterviewSession | undefined {
  return interviewSessions.find((s) => s.applicationId === applicationId);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getTranscriptForSession(_sessionId: string): TranscriptEntry[] {
  return demoTranscript;
}

export function getFunnelStats() {
  return funnelStats;
}

export function getCandidateWithApplication(candidateId: string) {
  const candidate = getCandidate(candidateId);
  const application = applications.find((a) => a.candidateId === candidateId);
  if (!candidate || !application) return null;

  const job = getJob(application.jobRoleId);
  const session = getInterviewSession(application.id);

  return { candidate, application, job, session };
}

export function getJobStats(jobId: string) {
  return jobStats[jobId] ?? { sourced: 0, applied: 0, interview: 0, assessment: 0, cleared: 0 };
}

export function getRecentActivity() {
  return recentActivity;
}

export function getHiringTeam() {
  return hiringTeam;
}

export function getDashboardStats() {
  return {
    candidates: 28,
    activeJobs: jobs.filter((j) => j.status === "live").length,
    totalInterviews: 1248,
    cleared: 98,
  };
}
