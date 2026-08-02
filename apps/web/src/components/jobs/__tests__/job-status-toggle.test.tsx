import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { JobStatusToggle } from "@/components/jobs/job-status-toggle";

const updateJobAction = jest.fn();
const refreshState = jest.fn();
const toast = { success: jest.fn(), error: jest.fn() };

jest.mock("@/app/actions/hireloop", () => ({
  updateJobAction: (...args: unknown[]) => updateJobAction(...args),
}));

jest.mock("@/lib/store/provider", () => ({
  useHireLoop: () => ({ refreshState }),
}));

jest.mock("sonner", () => ({
  toast: { success: (...a: unknown[]) => toast.success(...a), error: (...a: unknown[]) => toast.error(...a) },
}));

describe("JobStatusToggle", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows Close applications for a live job and publishes to closed", async () => {
    updateJobAction.mockResolvedValue({ id: "job-1", status: "closed" });
    render(<JobStatusToggle jobId="job-1" status="live" />);

    expect(screen.getByRole("button", { name: /close applications/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /close applications/i }));

    await waitFor(() => {
      expect(updateJobAction).toHaveBeenCalledWith("job-1", { status: "closed" });
      expect(refreshState).toHaveBeenCalled();
    });
    expect(toast.success).toHaveBeenCalledWith("Applications closed");
  });

  it("shows Publish for a closed job and publishes to live", async () => {
    updateJobAction.mockResolvedValue({ id: "job-1", status: "live" });
    render(<JobStatusToggle jobId="job-1" status="closed" />);

    expect(screen.getByRole("button", { name: /publish/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /publish/i }));

    await waitFor(() => {
      expect(updateJobAction).toHaveBeenCalledWith("job-1", { status: "live" });
    });
    expect(toast.success).toHaveBeenCalledWith("Job published — link is live");
  });

  it("shows an error toast when the action fails", async () => {
    updateJobAction.mockResolvedValue({ ok: false, error: "Access denied" });
    render(<JobStatusToggle jobId="job-1" status="live" />);

    fireEvent.click(screen.getByRole("button", { name: /close applications/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Access denied");
    });
    expect(refreshState).not.toHaveBeenCalled();
  });
});
