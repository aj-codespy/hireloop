import { render, screen, fireEvent } from "@testing-library/react";
import { DbSyncBanner } from "@/components/admin/db-sync-banner";

jest.mock("@/lib/store/provider", () => ({
  useHireLoop: jest.fn(),
}));

jest.mock("@/lib/supabase/config", () => ({
  isSupabaseClientEnabled: jest.fn(),
}));

import { useHireLoop } from "@/lib/store/provider";
import { isSupabaseClientEnabled } from "@/lib/supabase/config";

const mockUseHireLoop = useHireLoop as jest.Mock;
const mockIsEnabled = isSupabaseClientEnabled as jest.Mock;

function baseCtx(overrides: Partial<{ usingSupabase: boolean }> = {}) {
  return {
    state: { jobs: [], applications: [], candidates: [], questions: [], scorecards: [] },
    hydrated: true,
    usingSupabase: true,
    createJob: jest.fn(),
    updateJob: jest.fn(),
    setJobQuestions: jest.fn(),
    ...overrides,
  };
}

describe("DbSyncBanner", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows a warning when client Supabase env exists but DB sync failed", () => {
    mockIsEnabled.mockReturnValue(true);
    mockUseHireLoop.mockReturnValue(baseCtx({ usingSupabase: false }));

    render(<DbSyncBanner />);

    expect(screen.getByText("Database sync failed")).toBeInTheDocument();
  });

  it("hides the banner when the database is connected", () => {
    mockIsEnabled.mockReturnValue(true);
    mockUseHireLoop.mockReturnValue(baseCtx({ usingSupabase: true }));

    render(<DbSyncBanner />);

    expect(screen.queryByText(/Database sync failed/i)).not.toBeInTheDocument();
  });

  it("hides the banner when Supabase client env is absent (local demo mode)", () => {
    mockIsEnabled.mockReturnValue(false);
    mockUseHireLoop.mockReturnValue(baseCtx({ usingSupabase: false }));

    render(<DbSyncBanner />);

    expect(screen.queryByText(/Database sync failed/i)).not.toBeInTheDocument();
  });

  it("is dismissible", () => {
    mockIsEnabled.mockReturnValue(true);
    mockUseHireLoop.mockReturnValue(baseCtx({ usingSupabase: false }));

    render(<DbSyncBanner />);

    fireEvent.click(screen.getByRole("button"));
    expect(screen.queryByText(/Database sync failed/i)).not.toBeInTheDocument();
  });
});
