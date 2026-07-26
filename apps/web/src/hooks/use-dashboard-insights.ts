import { useMemo } from "react";
import type { HireLoopState } from "@/lib/store/provider";
import { useHireLoop } from "@/lib/store/provider";

export type DashboardActionItem = {
  id: string;
  title: string;
  description: string;
  href: string;
  priority: "high" | "medium";
};

export type DashboardInsights = {
  greeting: string;
  metrics: {
    totalApplications: number;
    activeJobs: number;
    interviewed: number;
    interviewSent: number;
    passedAi: number;
    interviewCompletionRate: number | null;
    passRate: number | null;
    awaitingReview: number;
  };
  hints: {
    applications: string;
    activeJobs: string;
    interviewed: string;
    finalInterview: string;
  };
  actionItems: DashboardActionItem[];
  isEmptyOrg: boolean;
};

function daysSince(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24);
}

function hoursUntil(iso: string): number {
  return (new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60);
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function computeInsights(state: HireLoopState): DashboardInsights {
  const apps = state.applications;
  const interviewedStatuses = [
    "interviewed",
    "passed_ai",
    "rejected_ai",
    "partner_review",
    "hired",
  ] as const;
  const interviewed = apps.filter((a) =>
    interviewedStatuses.includes(a.status as (typeof interviewedStatuses)[number])
  ).length;
  const interviewSent = apps.filter((a) => a.status === "interview_sent").length;
  const passedAi = apps.filter((a) => a.status === "passed_ai").length;
  const activeJobs = state.jobs.filter((j) => j.status === "live").length;

  const interviewCompletionRate =
    interviewSent + interviewed > 0
      ? Math.round((interviewed / (interviewSent + interviewed)) * 100)
      : null;
  const passRate = interviewed > 0 ? Math.round((passedAi / interviewed) * 100) : null;

  const actionItems: DashboardActionItem[] = [];

  for (const app of apps.filter((a) => a.status === "passed_ai")) {
    const candidate = state.candidates.find((c) => c.id === app.candidateId);
    actionItems.push({
      id: `review-${app.id}`,
      title: `${candidate?.name ?? "Candidate"} passed screening`,
      description: "Review interview scores and move to final interview or reject.",
      href: `/admin/candidates/${app.candidateId}`,
      priority: "high",
    });
  }

  for (const app of apps.filter((a) => a.status === "interview_sent")) {
    if (app.tokenExpiresAt && hoursUntil(app.tokenExpiresAt) < 24 && hoursUntil(app.tokenExpiresAt) > 0) {
      const candidate = state.candidates.find((c) => c.id === app.candidateId);
      actionItems.push({
        id: `expiring-${app.id}`,
        title: `Interview link expiring soon &mdash; ${candidate?.name ?? "Candidate"}`,
        description: "Link expires within 24 hours. Resend or follow up if needed.",
        href: `/admin/candidates/${app.candidateId}`,
        priority: "high",
      });
    }
  }

  for (const app of apps.filter((a) => a.status === "applied" && daysSince(a.createdAt) > 7)) {
    const job = state.jobs.find((j) => j.id === app.jobRoleId);
    if (job?.status !== "live") continue;
    const candidate = state.candidates.find((c) => c.id === app.candidateId);
    actionItems.push({
      id: `stale-${app.id}`,
      title: `Application waiting ${Math.floor(daysSince(app.createdAt))} days`,
      description: `${candidate?.name ?? "Candidate"} applied to ${job.title}. Review eligibility.`,
      href: `/admin/candidates/${app.candidateId}`,
      priority: "medium",
    });
  }

  for (const session of state.interviewSessions) {
    if (session.proctoringSummary?.flagged || session.status === "flagged") {
      const app = apps.find((a) => a.id === session.applicationId);
      if (!app) continue;
      const candidate = state.candidates.find((c) => c.id === app.candidateId);
      actionItems.push({
        id: `proctor-${session.id}`,
        title: `Proctoring review &mdash; ${candidate?.name ?? "Candidate"}`,
        description: session.proctoringSummary?.reason ?? "Session flagged for manual review.",
        href: `/admin/candidates/${app.candidateId}`,
        priority: "high",
      });
    }
  }

  for (const job of state.jobs.filter((j) => j.status === "live")) {
    const jobQuestions = state.questions.filter((q) => q.jobRoleId === job.id && q.isActive);
    if (jobQuestions.length === 0) {
      actionItems.push({
        id: `no-questions-${job.id}`,
        title: `No interview questions &mdash; ${job.title}`,
        description: "Add questions before candidates can complete interviews.",
        href: `/admin/jobs/${job.id}/questions`,
        priority: "high",
      });
    }
  }

  const sortedActions = actionItems
    .sort((a, b) => (a.priority === "high" ? -1 : 1) - (b.priority === "high" ? -1 : 1))
    .slice(0, 8);

  const awaitingReview = passedAi;
  const finalInterview = apps.filter((a) => ["partner_review", "hired"].includes(a.status)).length;

  return {
    greeting: getGreeting(),
    metrics: {
      totalApplications: apps.length,
      activeJobs,
      interviewed,
      interviewSent,
      passedAi,
      interviewCompletionRate,
      passRate,
      awaitingReview,
    },
    hints: {
      applications:
        apps.length === 0
          ? "Share an apply link to get started"
          : `${interviewSent} interview link${interviewSent !== 1 ? "s" : ""} outstanding`,
      activeJobs:
        activeJobs === 0
          ? "Publish a role to open applications"
          : `${activeJobs} role${activeJobs !== 1 ? "s" : ""} accepting applicants`,
      interviewed:
        interviewCompletionRate != null
          ? `${interviewCompletionRate}% completion rate`
          : "No interviews sent yet",
      finalInterview:
        awaitingReview > 0
          ? `${awaitingReview} awaiting your review`
          : finalInterview > 0
            ? `${finalInterview} in final stages`
            : "Move passed candidates forward",
    },
    actionItems: sortedActions,
    isEmptyOrg: apps.length === 0 && state.jobs.length === 0,
  };
}

export function useDashboardInsights(): DashboardInsights {
  const { state } = useHireLoop();
  return useMemo(() => computeInsights(state), [state]);
}
