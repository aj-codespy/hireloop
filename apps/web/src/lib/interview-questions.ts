import type { QuestionInput } from "@/lib/store/provider";

export type InterviewQuestionConfigError =
  | "missing_count"
  | "below_mandatory"
  | "above_pool"
  | "not_enough_variable";

export function countActiveQuestions(questions: QuestionInput[]): number {
  return questions.filter((q) => q.promptText.trim() && q.isActive).length;
}

export function countMandatoryQuestions(questions: QuestionInput[]): number {
  return questions.filter((q) => q.promptText.trim() && q.isActive && q.isMandatory).length;
}

export function validateInterviewQuestionCount(
  interviewQuestionCount: number | null | undefined,
  questions: QuestionInput[]
): InterviewQuestionConfigError | null {
  if (interviewQuestionCount == null) return null;

  const active = countActiveQuestions(questions);
  const mandatory = countMandatoryQuestions(questions);
  const variable = active - mandatory;

  if (!Number.isFinite(interviewQuestionCount) || interviewQuestionCount < 1) {
    return "missing_count";
  }
  if (interviewQuestionCount <= mandatory) {
    return "below_mandatory";
  }
  if (interviewQuestionCount > active) {
    return "above_pool";
  }
  const variableNeeded = interviewQuestionCount - mandatory;
  if (variableNeeded > variable) {
    return "not_enough_variable";
  }
  return null;
}

export const INTERVIEW_CONFIG_ERRORS: Record<InterviewQuestionConfigError, string> = {
  missing_count: "Enter how many questions to ask per interview.",
  below_mandatory:
    "Total questions per interview must be greater than the number of mandatory questions.",
  above_pool: "Total cannot exceed the number of active questions in the pool.",
  not_enough_variable:
    "Not enough variable questions in the pool for this interview size.",
};
