import { renderHook, act } from "@testing-library/react";
import { toast } from "sonner";

jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

const transitionApplicationStageAction = jest.fn();
const refreshState = jest.fn();

jest.mock("@/app/actions/hireloop", () => ({
  transitionApplicationStageAction: (...args: unknown[]) =>
    transitionApplicationStageAction(...args),
}));

jest.mock("@/lib/store/provider", () => ({
  useHireLoop: () => ({
    state: {
      organization: { id: "org-1", name: "Acme", primaryColor: "#F97316" },
      jobs: [],
      candidates: [],
      applications: [],
      interviewSessions: [],
      scorecards: [],
      questions: [],
    },
    refreshState,
  }),
  useApplicationRows: () => [
    {
      application: { id: "app-1", status: "applied" },
      candidate: { id: "cand-1", name: "Alice", email: "a@b.com" },
      job: { id: "job-1", title: "Engineer" },
      session: null,
    },
  ],
}));

jest.mock("@/lib/api/client", () => ({
  api: { listApplications: jest.fn().mockResolvedValue({ data: [] }) },
}));

import { useInterviewPipeline } from "@/hooks/useInterviewPipeline";

jest.mock("@/lib/constants", () => ({
  APPLICATION_STATUS_LABELS: {
    applied: "Applied",
    shortlisted: "Shortlisted",
    interview_sent: "Interview sent",
    interviewed: "Interviewed",
    passed_ai: "Passed AI",
    cleared_interviews: "Cleared interviews",
  },
  PIPELINE_COLUMNS: [
    "applied",
    "shortlisted",
    "interview_sent",
    "interviewed",
    "passed_ai",
    "cleared_interviews",
  ],
}));

describe("useInterviewPipeline handleDragEnd", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("persists a valid transition via the server action and refreshes the store", async () => {
    transitionApplicationStageAction.mockResolvedValue({
      id: "app-1",
      status: "shortlisted",
    });

    const { result } = renderHook(() => useInterviewPipeline());

    await act(async () => {
      await result.current.handleDragEnd("card:app-1", "shortlisted");
    });

    expect(transitionApplicationStageAction).toHaveBeenCalledWith({
      applicationId: "app-1",
      status: "shortlisted",
    });
    expect(refreshState).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith("Moved to Shortlisted");
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("shows an error toast when the server action rejects the transition", async () => {
    transitionApplicationStageAction.mockResolvedValue({
      ok: false,
      error: "This transition is not available from the admin pipeline.",
    });

    const { result } = renderHook(() => useInterviewPipeline());

    await act(async () => {
      await result.current.handleDragEnd("card:app-1", "passed_ai");
    });

    expect(transitionApplicationStageAction).toHaveBeenCalled();
    expect(refreshState).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith(
      "This transition is not available from the admin pipeline."
    );
  });

  it("does nothing when dropped on the same column or no target", async () => {
    const { result } = renderHook(() => useInterviewPipeline());

    await act(async () => {
      await result.current.handleDragEnd("card:app-1", "card:app-1");
    });
    await act(async () => {
      await result.current.handleDragEnd("card:app-1", "null");
    });

    expect(transitionApplicationStageAction).not.toHaveBeenCalled();
  });

  it("treats an unknown target status as a no-op", async () => {
    const { result } = renderHook(() => useInterviewPipeline());

    await act(async () => {
      await result.current.handleDragEnd("card:app-1", "not-a-column");
    });

    expect(transitionApplicationStageAction).not.toHaveBeenCalled();
  });
});
