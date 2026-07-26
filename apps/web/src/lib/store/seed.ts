import type { HireLoopState } from "@/lib/store/provider";
import {
  applications,
  candidates,
  interviewSessions,
  jobs,
  organization,
  questions,
  scorecards,
} from "@/lib/mock-data";

/** Initial seed — loaded once when localStorage is empty */
export function seedState(): HireLoopState {
  return {
    organization,
    jobs: jobs.map((j) => ({
      ...j,
      passingScore: j.passingScore ?? null,
      interviewQuestionCount: j.interviewQuestionCount ?? null,
      updatedAt: j.createdAt,
    })),
    questions: questions.map((q) => ({
      ...q,
      timeLimitSeconds: q.timeLimitSeconds ?? null,
      scoreThreshold: null,
      isMandatory: q.isMandatory ?? false,
    })),
    candidates: [...candidates],
    applications: [...applications],
    interviewSessions: [...interviewSessions],
    scorecards: [...scorecards],
  };
}
