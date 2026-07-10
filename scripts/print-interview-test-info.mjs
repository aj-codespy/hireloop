#!/usr/bin/env node
/**
 * Print local interview testing info (jobs, candidates with links).
 * Run: node scripts/print-interview-test-info.mjs
 */
import { createRequire } from "node:module";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { createClient } = require(resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../apps/web/node_modules/@supabase/supabase-js"
));

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(resolve(root, "apps/web/.env.local"));

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const base = process.env.INTERVIEW_BASE_URL || "http://localhost:3000";

if (!url || !secret) {
  console.error("Missing Supabase env in apps/web/.env.local");
  process.exit(1);
}

const supabase = createClient(url, secret, { auth: { persistSession: false } });

async function main() {
  const { data: jobs, error: jobError } = await supabase
    .from("job_roles")
    .select("id, title, status")
    .order("created_at", { ascending: false });
  if (jobError) throw jobError;

  const { data: rows, error } = await supabase
    .from("applications")
    .select("id, status, interview_token, token_expires_at, job_role_id, candidates(name, email)")
    .order("created_at", { ascending: false });
  if (error) throw error;

  console.log("\n=== HireLoop interview test setup ===\n");
  console.log("Password for all test accounts: TestPass123!\n");
  console.log("Admin login:  http://localhost:3000/admin/login");
  console.log("  Email: admin@hireloop.test\n");
  console.log("Candidate login: http://localhost:3000/candidate/login\n");

  console.log("Jobs:");
  for (const job of jobs ?? []) {
    console.log(`  • ${job.title} (${job.id}) — ${job.status}`);
    console.log(`    Apply URL: ${base}/apply/${job.id}`);
  }

  console.log("\nCandidates (best for interview test):");
  for (const row of rows ?? []) {
    const c = row.candidates;
    if (!c) continue;
    const link = row.interview_token ? `${base}/candidate/${row.interview_token}` : null;
    const marker = row.status === "interview_sent" ? "★" : " ";
    console.log(
      `${marker} ${c.name} <${c.email}> — ${row.status}${link ? `\n    Interview: ${link}` : ""}`
    );
  }

  const ready = (rows ?? []).filter((r) => r.interview_token && r.status === "interview_sent");
  if (ready.length) {
    console.log("\nRecommended flow:");
    console.log("  1. Admin → Candidates → open candidate with ★");
    console.log("  2. Job tab → copy “Open candidate interview” link");
    console.log("  3. Or sign in as that candidate → Profile → Interview");
    console.log("  4. After interview → Admin → same candidate → Scores / transcript");
    console.log(`\nQuick link: ${base}/candidate/${ready[0].interview_token}`);
  } else {
    console.log("\nNo interview_sent candidates with tokens.");
    console.log("In admin: open a shortlisted candidate → Regenerate & send link.");
  }
  console.log("");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
