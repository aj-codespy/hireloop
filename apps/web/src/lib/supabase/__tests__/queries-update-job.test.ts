import { updateJobInDb } from "@/lib/supabase/queries";

jest.mock("@/lib/supabase/admin", () => ({
  createAdminClient: jest.fn(),
}));

import { createAdminClient } from "@/lib/supabase/admin";
const mockCreateAdminClient = createAdminClient as jest.Mock;

interface Filter {
  col: string;
  val: unknown;
}

function makeFakeClient(tableData: Record<string, unknown[]>) {
  const tables = new Set(Object.keys(tableData));

  const builder = {
    _table: "",
    _filters: [] as Filter[],
    _updates: null as Record<string, unknown> | null,
    from(table: string) {
      return { ...builder, _table: table, _filters: [], _updates: null };
    },
    select() {
      return this;
    },
    eq(col: string, val: unknown) {
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
    single() {
      const rows = this.applyFilters((tableData[this._table] ?? []) as Record<string, unknown>[]);
      return { data: rows[0] ?? null, error: null };
    },
    update(patch: Record<string, unknown>) {
      return { ...this, _updates: patch };
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
  description: "desc",
  status: "live",
  eligibility_rules: [],
  passing_score: null,
  interview_question_count: null,
  form_fields: [],
  created_at: "2026-07-01T00:00:00Z",
  updated_at: "2026-07-01T00:00:00Z",
};

describe("updateJobInDb", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("updates a job owned by the caller's org", async () => {
    const fake = makeFakeClient({ job_roles: [jobRow] });
    mockCreateAdminClient.mockReturnValue(fake);

    const updated = await updateJobInDb("job-1", { title: "Senior Engineer" }, "org-1");

    expect(updated.title).toBe("Senior Engineer");
    expect(updated.orgId).toBe("org-1");
  });

  it("throws Access denied when the job belongs to another org", async () => {
    const fake = makeFakeClient({ job_roles: [jobRow] });
    mockCreateAdminClient.mockReturnValue(fake);

    await expect(
      updateJobInDb("job-1", { title: "Hijacked" }, "org-2")
    ).rejects.toThrow("Access denied");
  });

  it("throws when the job does not exist", async () => {
    const fake = makeFakeClient({ job_roles: [] });
    mockCreateAdminClient.mockReturnValue(fake);

    await expect(updateJobInDb("missing", { title: "X" }, "org-1")).rejects.toThrow();
  });
});
