import { submitApplicationInDb, fetchInterviewContextByToken } from "@/lib/supabase/queries";

jest.mock("@/lib/supabase/admin", () => ({
  createAdminClient: jest.fn(),
}));

import { createAdminClient } from "@/lib/supabase/admin";

interface Filter {
  col: string;
  val: unknown;
}

/**
 * Chainable fake supabase client.
 * `tableData[table]` holds rows; `.eq()`/`.ilike()` narrow them like the real SDK.
 */
function makeFakeClient(tableData: Record<string, unknown[]>) {
  const tables = new Set(Object.keys(tableData));

  const builder = {
    _table: "",
    _filters: [] as Filter[],
    from(table: string) {
      return { ...builder, _table: table, _filters: [] };
    },
    select() {
      return this;
    },
    eq(col: string, val: unknown) {
      return { ...this, _filters: [...this._filters, { col, val }] };
    },
    ilike(col: string, val: unknown) {
      return { ...this, _filters: [...this._filters, { col, val }] };
    },
    order() {
      return this;
    },
    applyFilters(rows: Record<string, unknown>[]) {
      return rows.filter((row) =>
        this._filters.every((f) => row[f.col] === f.val)
      );
    },
    limit(n: number) {
      const rows = this.applyFilters((tableData[this._table] ?? []) as Record<string, unknown>[]);
      return { data: rows.slice(0, n), error: null };
    },
    maybeSingle() {
      const rows = this.applyFilters((tableData[this._table] ?? []) as Record<string, unknown>[]);
      // supabase-js rejects a single-row fetch when multiple rows match
      if (rows.length > 1) {
        return {
          data: null,
          error: {
            message:
              'Cannot coerce the result to a single JSON object: expected a single object, but received multiple objects.',
          },
        };
      }
      return { data: rows[0] ?? null, error: null };
    },
    single() {
      const rows = this.applyFilters((tableData[this._table] ?? []) as Record<string, unknown>[]);
      if (rows.length > 1) {
        return {
          data: null,
          error: {
            message:
              'Cannot coerce the result to a single JSON object: expected a single object, but received multiple objects.',
          },
        };
      }
      return { data: rows[0] ?? null, error: null };
    },
    insert() {
      return { error: null };
    },
    update() {
      return this;
    },
  };

  return {
    from(table: string) {
      if (!tables.has(table)) throw new Error(`Unexpected table in test: ${table}`);
      return builder.from(table);
    },
  };
}

const jobRow = {
  id: "job-1",
  org_id: "org-1",
  title: "Engineer",
  description: "x",
  status: "live",
  eligibility_rules: [],
  passing_score: null,
  interview_question_count: null,
  form_fields: [],
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

describe("submitApplicationInDb — duplicate candidates (Bug 2)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("does not crash with a raw coerce error when duplicate candidate rows exist", async () => {
    const dupRows = [
      { id: "cand-old", org_id: "org-1", email: "a@x.com", name: "A", created_at: "2026-01-01T00:00:00Z" },
      { id: "cand-new", org_id: "org-1", email: "a@x.com", name: "A", created_at: "2026-01-02T00:00:00Z" },
    ];
    (createAdminClient as jest.Mock).mockReturnValue(
      makeFakeClient({
        job_roles: [jobRow],
        candidates: dupRows,
        applications: [],
      })
    );

    const result = await submitApplicationInDb("job-1", { name: "A", email: "a@x.com" });
    // Self-heals: uses the earliest candidate row, application succeeds
    expect(result.candidate.id).toBe("cand-old");
  });

  it("scopes candidate lookup by org so same email at another org does not collide", async () => {
    const otherOrgRows = [
      { id: "cand-other", org_id: "org-9", email: "a@x.com", name: "A", created_at: "2026-01-01T00:00:00Z" },
    ];
    (createAdminClient as jest.Mock).mockReturnValue(
      makeFakeClient({
        job_roles: [jobRow],
        candidates: otherOrgRows,
        applications: [],
      })
    );

    const result = await submitApplicationInDb("job-1", { name: "A", email: "a@x.com" });
    // The other-org candidate is not reused — a new candidate is created
    expect(result.candidate.id).not.toBe("cand-other");
  });

  it("throws a human error for duplicate applications to the same job", async () => {
    const dupRows = [
      { id: "app-1", candidate_id: "cand-1", job_role_id: "job-1" },
      { id: "app-2", candidate_id: "cand-1", job_role_id: "job-1" },
    ];
    const candidateRow = { id: "cand-1", org_id: "org-1", email: "a@x.com", name: "A", created_at: "2026-01-01T00:00:00Z" };
    (createAdminClient as jest.Mock).mockReturnValue(
      makeFakeClient({
        job_roles: [jobRow],
        candidates: [candidateRow],
        applications: dupRows,
      })
    );

    await expect(
      submitApplicationInDb("job-1", { name: "A", email: "a@x.com" })
    ).rejects.toThrow(
      "You have already attempted this job. If you believe this is a mistake, please contact the hiring team."
    );
  });
});

describe("fetchInterviewContextByToken — duplicate tokens", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("throws a human error instead of raw coerce error for duplicate interview tokens", async () => {
    const dupRows = [
      { id: "app-1", interview_token: "tok-1", candidate_id: "cand-1", job_role_id: "job-1" },
      { id: "app-2", interview_token: "tok-1", candidate_id: "cand-2", job_role_id: "job-1" },
    ];
    (createAdminClient as jest.Mock).mockReturnValue(
      makeFakeClient({ applications: dupRows })
    );

    await expect(fetchInterviewContextByToken("tok-1")).rejects.toThrow(
      /not valid|contact the hiring team/i
    );
  });
});
