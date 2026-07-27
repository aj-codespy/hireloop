"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  createJobAction,
  loadHireLoopStateAction,
  setJobQuestionsAction,
  submitApplicationAction,
  updateJobAction,
  updateOrganizationAction,
} from "@/app/actions/hireloop";
import { isActionError } from "@/lib/action-error";
import { evaluateEligibility } from "@/lib/eligibility";
import { isDocumentFieldType } from "@/lib/form-fields";
import { generateId, generateInterviewToken } from "@/lib/id";
import { loadLocalState, persistLocalState } from "@/lib/store/local-store";
import { seedState } from "@/lib/store/seed";
import { isSupabaseClientEnabled } from "@/lib/supabase/config";
import type {
  Application,
  ApplicationFormField,
  ApplicationStatus,
  Candidate,
  EligibilityRule,
  FormResponseValue,
  InterviewSession,
  JobRole,
  Organization,
  Question,
  QuestionSection,
  Scorecard,
} from "@/lib/types";

export interface HireLoopState {
  organization: Organization;
  jobs: JobRole[];
  questions: Question[];
  candidates: Candidate[];
  applications: Application[];
  interviewSessions: InterviewSession[];
  scorecards: Scorecard[];
}

type HireLoopContextValue = {
  state: HireLoopState;
  hydrated: boolean;
  usingSupabase: boolean;
  createJob: (input: CreateJobInput) => Promise<JobRole>;
  updateJob: (id: string, patch: Partial<JobRole>) => Promise<JobRole | undefined>;
  setJobQuestions: (
    jobId: string,
    questions: QuestionInput[],
    interviewQuestionCount?: number | null
  ) => Promise<void>;
  submitApplication: (
    jobId: string,
    formData: FormData
  ) => Promise<{ application: Application; candidate: Candidate; eligibilityPassed: boolean }>;
  updateOrganization: (
    patch: Partial<Pick<Organization, "name" | "logoUrl" | "primaryColor" | "introVideoUrl" | "website" | "about">>
  ) => Promise<Organization>;
  getJobApplyUrl: (jobId: string) => string;
  refreshState: () => Promise<void>;
};

export type RoundInput = {
  id?: string;
  title: string;
  interviewType: string; // e.g. "ai" or "human"
  passingScore: number | null;
  interviewQuestionCount: number | null;
  questions: QuestionInput[];
};

export type CreateJobInput = {
  title: string;
  description: string;
  status: JobRole["status"];
  formFields: ApplicationFormField[];
  eligibilityRules: EligibilityRule[];
  passingScore: number | null;
  interviewQuestionCount?: number | null;
  rounds?: RoundInput[];
};

export type QuestionInput = {
  id?: string;
  section: QuestionSection;
  promptText: string;
  idealAnswerNotes: string;
  timeLimitSeconds: number | null;
  scoreThreshold: number | null;
  isActive: boolean;
  isMandatory: boolean;
};

const HireLoopContext = createContext<HireLoopContextValue | null>(null);

export function HireLoopProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<HireLoopState>(seedState);
  const [hydrated, setHydrated] = useState(false);
  const [usingSupabase, setUsingSupabase] = useState(false);

  const refreshState = useCallback(async () => {
    try {
      const remote = await loadHireLoopStateAction();
      if (remote && !isActionError(remote)) {
        setState(remote);
        setUsingSupabase(true);
        return;
      }
      setUsingSupabase(false);
      setState(loadLocalState());
    } catch (err) {
      console.error("Failed to refresh state from database:", err);
      setUsingSupabase(false);
      setState(loadLocalState());
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    // Only the admin workspace consumes the global store. Candidate, interview,
    // apply, and marketing pages load their own data server-side, so we skip the
    // heavy multi-table load there to keep navigation fast.
    const path = typeof window !== "undefined" ? window.location.pathname : "";
    const needsGlobalStore = path.startsWith("/admin") || path.startsWith("/org");

    if (!needsGlobalStore) {

      setState(loadLocalState());

      setUsingSupabase(false);

      setHydrated(true);
      return;
    }

    async function hydrate() {
      try {
        const remote = await loadHireLoopStateAction();
        if (cancelled) return;
        if (remote && !isActionError(remote)) {
          setState(remote);
          setUsingSupabase(true);
        } else {
          setState(loadLocalState());
          setUsingSupabase(false);
        }
      } catch (err) {
        console.error("Failed to hydrate state from database:", err);
        if (!cancelled) {
          setState(loadLocalState());
          setUsingSupabase(false);
        }
      } finally {
        if (!cancelled) setHydrated(true);
      }
    }

    hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  const commitLocal = useCallback((updater: (prev: HireLoopState) => HireLoopState) => {
    setState((prev) => {
      const next = updater(prev);
      persistLocalState(next);
      return next;
    });
  }, []);

  const createJob = useCallback(
    async (input: CreateJobInput): Promise<JobRole> => {
      if (usingSupabase) {
        const res = await createJobAction(input);
        if (isActionError(res)) {
          throw new Error(res.error);
        }
        setState((prev) => ({ ...prev, jobs: [res, ...prev.jobs] }));
        return res;
      }

      const now = new Date().toISOString();
      const job: JobRole = {
        id: generateId("job"),
        orgId: state.organization.id,
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
      commitLocal((prev) => ({ ...prev, jobs: [job, ...prev.jobs] }));
      return job;
    },
    [commitLocal, state.organization.id, usingSupabase]
  );

  const updateJob = useCallback(
    async (id: string, patch: Partial<JobRole>): Promise<JobRole | undefined> => {
      if (usingSupabase) {
        const res = await updateJobAction(id, patch);
        if (isActionError(res)) {
          throw new Error(res.error);
        }
        setState((prev) => ({
          ...prev,
          jobs: prev.jobs.map((j) => (j.id === id ? res : j)),
        }));
        return res;
      }

      let updated: JobRole | undefined;
      commitLocal((prev) => ({
        ...prev,
        jobs: prev.jobs.map((j) => {
          if (j.id !== id) return j;
          updated = { ...j, ...patch, updatedAt: new Date().toISOString() };
          return updated;
        }),
      }));
      return updated;
    },
    [commitLocal, usingSupabase]
  );

  const setJobQuestions = useCallback(
    async (
      jobId: string,
      inputs: QuestionInput[],
      interviewQuestionCount?: number | null
    ): Promise<void> => {
      if (usingSupabase) {
        const res = await setJobQuestionsAction(jobId, inputs, interviewQuestionCount);
        if (isActionError(res)) {
          throw new Error(res.error);
        }
        const questions: Question[] = inputs.map((q, index) => ({
          id: q.id ?? generateId("q"),
          questionBankId: `bank-${q.section}`,
          jobRoleId: jobId,
          section: q.section,
          promptText: q.promptText,
          idealAnswerNotes: q.idealAnswerNotes,
          timeLimitSeconds: q.timeLimitSeconds,
          scoreThreshold: q.scoreThreshold,
          order: index + 1,
          isActive: q.isActive,
          isMandatory: q.isMandatory,
        }));
        setState((prev) => ({
          ...prev,
          questions: [...prev.questions.filter((q) => q.jobRoleId !== jobId), ...questions],
          jobs:
            interviewQuestionCount !== undefined
              ? prev.jobs.map((j) =>
                  j.id === jobId
                    ? { ...j, interviewQuestionCount: interviewQuestionCount ?? null }
                    : j
                )
              : prev.jobs,
        }));
        return;
      }

      commitLocal((prev) => {
        const rest = prev.questions.filter((q) => q.jobRoleId !== jobId);
        const questions: Question[] = inputs.map((q, index) => ({
          id: q.id ?? generateId("q"),
          questionBankId: `bank-${q.section}`,
          jobRoleId: jobId,
          section: q.section,
          promptText: q.promptText,
          idealAnswerNotes: q.idealAnswerNotes,
          timeLimitSeconds: q.timeLimitSeconds,
          scoreThreshold: q.scoreThreshold,
          order: index + 1,
          isActive: q.isActive,
          isMandatory: q.isMandatory,
        }));
        return {
          ...prev,
          questions: [...rest, ...questions],
          jobs:
            interviewQuestionCount !== undefined
              ? prev.jobs.map((j) =>
                  j.id === jobId
                    ? { ...j, interviewQuestionCount: interviewQuestionCount ?? null }
                    : j
                )
              : prev.jobs,
        };
      });
    },
    [commitLocal, usingSupabase]
  );

  const submitApplication = useCallback(
    async (jobId: string, formData: FormData) => {
      if (usingSupabase || isSupabaseClientEnabled()) {
        try {
          const result = await submitApplicationAction(jobId, formData);
          if (isActionError(result)) {
            throw new Error(result.error);
          }
          setState((prev) => {
            const existingIdx = prev.candidates.findIndex((c) => c.id === result.candidate.id);
            const candidates =
              existingIdx >= 0
                ? prev.candidates.map((c, i) => (i === existingIdx ? result.candidate : c))
                : [result.candidate, ...prev.candidates];
            return {
              ...prev,
              candidates,
              applications: [result.application, ...prev.applications],
            };
          });
          return result;
        } catch (err) {
          if (usingSupabase || !(err instanceof Error) || err.message !== "Supabase is not configured.") {
            throw err;
          }
        }
      }

      const job = state.jobs.find((j) => j.id === jobId);
      if (!job) throw new Error("Job not found");

      const formResponse: Record<string, FormResponseValue> = {};
      for (const field of job.formFields) {
        const raw = formData.get(field.fieldKey);
        if (raw === null || raw === "") continue;
        if (isDocumentFieldType(field.type) && raw instanceof File) {
          formResponse[field.fieldKey] = {
            originalName: raw.name,
            storagePath: "",
            mimeType: raw.type || "application/octet-stream",
            sizeBytes: raw.size,
          };
        } else if (field.type === "number") {
          formResponse[field.fieldKey] = Number(raw);
        } else if (!(raw instanceof File)) {
          formResponse[field.fieldKey] = String(raw);
        }
      }

      const eligibility = evaluateEligibility(formResponse, job.eligibilityRules);
      const now = new Date().toISOString();

      const name = String(formResponse.name ?? formResponse.full_name ?? "Unknown candidate");
      const email = String(formResponse.email ?? "").trim().toLowerCase();
      const phone = formResponse.phone ? String(formResponse.phone) : undefined;

      const existing = state.candidates.find((c) => c.email.toLowerCase() === email);
      const dupApp = state.applications.find(
        (a) => a.jobRoleId === jobId && a.candidateId === (existing?.id ?? "")
      );
      if (dupApp) throw new Error("You have already applied to this job");

      const candidate: Candidate = existing
        ? { ...existing, name, phone }
        : {
            id: generateId("cand"),
            orgId: job.orgId,
            name,
            email,
            phone,
            source: "website",
            createdAt: now,
          };

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
        id: generateId("app"),
        candidateId: candidate.id,
        jobRoleId: jobId,
        formResponse,
        status,
        interviewToken,
        tokenExpiresAt,
        createdAt: now,
      };

      commitLocal((prev) => {
        const existingIdx = prev.candidates.findIndex((c) => c.id === candidate.id);
        const candidates =
          existingIdx >= 0
            ? prev.candidates.map((c, i) => (i === existingIdx ? candidate : c))
            : [candidate, ...prev.candidates];
        return {
          ...prev,
          candidates,
          applications: [application, ...prev.applications],
        };
      });

      return { application, candidate, eligibilityPassed: eligibility.passed };
    },
    [commitLocal, state.applications, state.candidates, state.jobs, usingSupabase]
  );

  const updateOrganization = useCallback(
    async (
      patch: Partial<
        Pick<Organization, "name" | "logoUrl" | "primaryColor" | "introVideoUrl" | "website" | "about">
      >
    ): Promise<Organization> => {
      if (usingSupabase) {
        const res = await updateOrganizationAction(patch);
        if (isActionError(res)) {
          throw new Error(res.error);
        }
        setState((prev) => ({ ...prev, organization: res }));
        return res;
      }

      let updated = { ...state.organization, ...patch };
      commitLocal((prev) => {
        updated = { ...prev.organization, ...patch };
        return { ...prev, organization: updated };
      });
      return updated;
    },
    [commitLocal, state.organization, usingSupabase]
  );

  const getJobApplyUrl = useCallback((jobId: string) => {
    if (typeof window === "undefined") return `/apply/${jobId}`;
    return `${window.location.origin}/apply/${jobId}`;
  }, []);

  const value = useMemo(
    () => ({
      state,
      hydrated,
      usingSupabase,
      createJob,
      updateJob,
      setJobQuestions,
      submitApplication,
      updateOrganization,
      getJobApplyUrl,
      refreshState,
    }),
    [
      state,
      hydrated,
      usingSupabase,
      createJob,
      updateJob,
      setJobQuestions,
      submitApplication,
      updateOrganization,
      getJobApplyUrl,
      refreshState,
    ]
  );

  return <HireLoopContext.Provider value={value}>{children}</HireLoopContext.Provider>;
}

export function useHireLoop() {
  const ctx = useContext(HireLoopContext);
  if (!ctx) throw new Error("useHireLoop must be used within HireLoopProvider");
  return ctx;
}

/** Read-only selectors */
export function useJobs() {
  const { state } = useHireLoop();
  return state.jobs;
}

export function useJob(id: string) {
  const { state } = useHireLoop();
  return state.jobs.find((j) => j.id === id);
}

export function useQuestionsForJob(jobId: string) {
  const { state } = useHireLoop();
  return state.questions
    .filter((q) => q.jobRoleId === jobId)
    .sort((a, b) => a.order - b.order);
}

export function useApplications() {
  const { state } = useHireLoop();
  return state.applications;
}

export function useApplicationByToken(token: string) {
  const { state } = useHireLoop();
  return state.applications.find((a) => a.interviewToken === token);
}

export function useCandidate(id: string) {
  const { state } = useHireLoop();
  return state.candidates.find((c) => c.id === id);
}

export function useInterviewSession(applicationId: string) {
  const { state } = useHireLoop();
  return state.interviewSessions.find((s) => s.applicationId === applicationId);
}

export function useScorecardsForApplication(applicationId: string) {
  const { state } = useHireLoop();
  return state.scorecards
    .filter((s) => s.applicationId === applicationId)
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
}

export function useDashboardMetrics() {
  const { state } = useHireLoop();
  const apps = state.applications;
  const interviewed = apps.filter((a) =>
    ["interviewed", "passed_ai", "rejected_ai", "partner_review", "hired"].includes(a.status)
  ).length;
  const shortlisted = apps.filter((a) =>
    ["shortlisted", "interview_sent", "interviewed", "passed_ai", "partner_review", "hired"].includes(
      a.status
    )
  ).length;

  return {
    totalApplications: apps.length,
    activeJobs: state.jobs.filter((j) => j.status === "live").length,
    interviewed,
    shortlisted,
    offers: apps.filter((a) => ["partner_review", "hired"].includes(a.status)).length,
  };
}

export function useApplicationRows() {
  const { state } = useHireLoop();
  return state.applications.map((app) => {
    const candidate = state.candidates.find((c) => c.id === app.candidateId);
    const job = state.jobs.find((j) => j.id === app.jobRoleId);
    const session = state.interviewSessions.find((s) => s.applicationId === app.id);
    const interviewed = ["interviewed", "passed_ai", "rejected_ai", "partner_review", "hired"].includes(
      app.status
    );
    return { application: app, candidate, job, session, interviewed };
  });
}
