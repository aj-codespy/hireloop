import { render, screen } from "@testing-library/react";
import { ApplyPageClient } from "@/components/candidate/apply-page-client";
import type { JobRole, Organization } from "@/lib/types";

jest.mock("@/lib/store/provider", () => ({
  useHireLoop: () => ({
    state: {
      jobs: [liveJob],
      organization: null,
    },
    hydrated: true,
  }),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

const liveJob: JobRole = {
  id: "job-live",
  orgId: "org-1",
  title: "Senior Engineer",
  description: "Build things",
  status: "live",
  eligibilityRules: [],
  passingScore: null,
  interviewQuestionCount: null,
  formFields: [],
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

const closedJob: JobRole = {
  ...liveJob,
  id: "job-closed",
  status: "closed",
};

const org: Organization = {
  id: "org-1",
  name: "Acme",
  primaryColor: "#F97316",
};

describe("ApplyPageClient", () => {
  it("renders the application form for a live job", () => {
    render(
      <ApplyPageClient initialJob={liveJob} initialOrganization={org} />
    );
    expect(screen.getByText("Senior Engineer")).toBeInTheDocument();
  });

  it("shows 'Applications closed' when the job exists but is not live", () => {
    render(
      <ApplyPageClient initialJob={closedJob} initialOrganization={org} />
    );
    expect(screen.getByText("Applications closed")).toBeInTheDocument();
    expect(screen.getByText("This role is not accepting applications")).toBeInTheDocument();
  });

  it("shows a not-found message when the server reports jobNotFound", () => {
    render(<ApplyPageClient initialJob={null} initialOrganization={null} jobNotFound />);
    expect(screen.getByText("This job link is no longer available")).toBeInTheDocument();
    expect(screen.queryByText("Applications closed")).not.toBeInTheDocument();
  });

  it("never renders local store jobs on the public apply page", () => {
    // The store contains liveJob, but the server did not provide it
    // (initialJob is null without jobNotFound). The page must not leak
    // local state onto a public URL — a stale localStorage job must not
    // mask a job that is absent from the database.
    render(<ApplyPageClient initialJob={null} initialOrganization={null} />);
    expect(screen.queryByText("Senior Engineer")).not.toBeInTheDocument();
    expect(screen.queryByText("Applications closed")).not.toBeInTheDocument();
    expect(screen.getByText("This job link is no longer available")).toBeInTheDocument();
  });
});
