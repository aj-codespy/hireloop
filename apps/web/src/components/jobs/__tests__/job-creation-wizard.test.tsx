import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { JobCreationWizard } from "@/components/jobs/job-creation-wizard";

const createJob = jest.fn();
const setJobQuestions = jest.fn();
const getJobApplyUrl = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("@/app/actions/hireloop", () => ({
  getJobCloneDataAction: jest.fn().mockResolvedValue(null),
}));

jest.mock("@/lib/store/provider", () => ({
  useHireLoop: () => ({ createJob, setJobQuestions, getJobApplyUrl }),
}));

jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn(), promise: jest.fn() },
}));

// Stub the nested question editor so the wizard can be driven quickly to Publish.
jest.mock("@/components/jobs/job-questions-editor", () => ({
  JobQuestionsEditor: ({ onSave, saveLabel }: { onSave: (qs: unknown[], n: null) => void; saveLabel?: string }) => (
    <button
      type="button"
      onClick={() =>
        onSave(
          [{ section: "technical", promptText: "Tell us about yourself", idealAnswerNotes: "", timeLimitSeconds: 60, scoreThreshold: null, isActive: true, isMandatory: false, id: "q-1" }],
          null
        )
      }
    >
      {saveLabel ?? "Save questions"}
    </button>
  ),
}));

const driveToPublishStep = async () => {
  render(<JobCreationWizard />);
  fireEvent.change(screen.getByLabelText(/Job title/), { target: { value: "Test Role" } });
  fireEvent.click(screen.getByRole("button", { name: /continue/i }));
  fireEvent.click(screen.getByRole("button", { name: /continue/i }));
  // Step 2: configure the round's questions via the stubbed editor.
  fireEvent.click(screen.getByRole("button", { name: /configure questions/i }));
  fireEvent.click(screen.getByRole("button", { name: /done/i }));
  fireEvent.click(screen.getByRole("button", { name: /continue/i }));
};

describe("JobCreationWizard publish-on-create + double-click guard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    createJob.mockResolvedValue({ id: "job-1", status: "live" });
    setJobQuestions.mockResolvedValue(undefined);
  });

  it("defaults publishLive to true so the button reads 'Publish job'", async () => {
    await driveToPublishStep();
    expect(screen.getByRole("button", { name: /publish job/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /save as draft/i })).not.toBeInTheDocument();
  });

  it("creates the job as live by default", async () => {
    await driveToPublishStep();
    fireEvent.click(screen.getByRole("button", { name: /publish job/i }));
    await waitFor(() => {
      expect(createJob).toHaveBeenCalledTimes(1);
      expect(createJob).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Test Role", status: "live" })
      );
    });
  });

  it("only creates ONE job when the publish button is clicked rapidly (no duplicates)", async () => {
    createJob.mockImplementation(() => new Promise((res) => setTimeout(() => res({ id: "job-1", status: "live" }), 10)));
    await driveToPublishStep();
    const btn = screen.getByRole("button", { name: /publish job/i });
    fireEvent.click(btn);
    fireEvent.click(btn);
    fireEvent.click(btn);
    await waitFor(() => expect(createJob).toHaveBeenCalledTimes(1));
  });
});