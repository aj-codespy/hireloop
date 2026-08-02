import { buildCandidatesCsv } from "@/lib/export/candidates-csv";
import type { HireLoopState } from "@/lib/store/provider";

function state(overrides: Partial<HireLoopState> = {}): HireLoopState {
  return {
    organization: { id: "org-1", name: "Acme", primaryColor: "#F97316" },
    jobs: [
      {
        id: "job-1",
        orgId: "org-1",
        title: "Software Engineer",
        description: "",
        status: "live",
        eligibilityRules: [],
        passingScore: 7,
        interviewQuestionCount: null,
        formFields: [],
        createdAt: "2026-07-01T00:00:00Z",
        updatedAt: "2026-07-01T00:00:00Z",
      },
      {
        id: "job-2",
        orgId: "org-1",
        title: "Product Manager",
        description: "",
        status: "closed",
        eligibilityRules: [],
        passingScore: null,
        interviewQuestionCount: null,
        formFields: [],
        createdAt: "2026-07-02T00:00:00Z",
        updatedAt: "2026-07-02T00:00:00Z",
      },
    ],
    candidates: [
      {
        id: "cand-1",
        name: "Alice, A.",
        email: "alice@example.com",
        phone: "+1 555 0100",
        source: "manual",
        createdAt: "2026-07-03T00:00:00Z",
      },
      {
        id: "cand-2",
        name: "Bob",
        email: "bob@example.com",
        source: "linkedin",
        createdAt: "2026-07-04T00:00:00Z",
      },
    ],
    applications: [
      {
        id: "app-1",
        candidateId: "cand-1",
        jobRoleId: "job-1",
        formResponse: {},
        status: "cleared_interviews",
        createdAt: "2026-07-03T00:00:00Z",
      },
      {
        id: "app-2",
        candidateId: "cand-2",
        jobRoleId: "job-2",
        formResponse: {},
        status: "applied",
        createdAt: "2026-07-05T00:00:00Z",
      },
    ],
    interviewSessions: [
      {
        id: "sess-1",
        applicationId: "app-1",
        status: "completed",
        overallScore: { totalScore: 8.5, pass: true, strengths: "", concerns: "", generatedAt: "" },
        startedAt: "2026-07-06T00:00:00Z",
      },
    ],
    scorecards: [],
    questions: [],
    ...overrides,
  };
}

describe("buildCandidatesCsv", () => {
  it("emits a header row and one row per application", () => {
    const csv = buildCandidatesCsv(state());
    const lines = csv.trim().split("\n");
    expect(lines[0]).toContain("Name");
    expect(lines).toHaveLength(3); // header + 2 applications
    expect(lines[1]).toContain("Alice");
    expect(lines[1]).toContain("Software Engineer");
  });

  it("quotes fields containing commas or quotes", () => {
    const csv = buildCandidatesCsv(state());
    const aliceLine = csv.split("\n")[1];
    // "Alice, A." must be quoted; comma inside quotes must not split the column
    expect(aliceLine).toMatch(/"Alice, A\."/);
    const columns = aliceLine.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/);
    expect(columns[0]).toBe('"Alice, A."');
    expect(columns[1]).toBe("alice@example.com");
  });

  it("filters to cleared interviews when onlyCleared is set", () => {
    const csv = buildCandidatesCsv(state(), { onlyCleared: true });
    const lines = csv.trim().split("\n");
    expect(lines).toHaveLength(2); // header + Alice only
    expect(lines[1]).toContain("Alice");
    expect(lines[1]).not.toContain("Bob");
  });

  it("filters by job id when jobId is set", () => {
    const csv = buildCandidatesCsv(state(), { jobId: "job-2" });
    const lines = csv.trim().split("\n");
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain("Bob");
  });

  it("includes AI score column when a session exists", () => {
    const csv = buildCandidatesCsv(state());
    const aliceLine = csv.split("\n")[1];
    expect(aliceLine).toContain("8.5");
  });

  it("handles an empty org gracefully", () => {
    const csv = buildCandidatesCsv(state({ candidates: [], applications: [], interviewSessions: [] }));
    expect(csv.trim().split("\n")).toHaveLength(1); // header only
  });
});
