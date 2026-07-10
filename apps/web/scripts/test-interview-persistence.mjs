/**
 * Interview persistence test (transcript column + API store flow)
 * Run: node --env-file=.env.local scripts/test-interview-persistence.mjs
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !secret) {
  console.error("FAIL: Missing Supabase env vars");
  process.exit(1);
}

const admin = createClient(url, secret, {
  auth: { persistSession: false, autoRefreshToken: false },
});

let passed = 0;
let failed = 0;

function ok(name) {
  passed++;
  console.log(`  ✓ ${name}`);
}

function fail(name, detail) {
  failed++;
  console.error(`  ✗ ${name}: ${detail}`);
}

const ts = Date.now();
const orgId = `org-int-${ts}`;
const jobId = `job-int-${ts}`;
const candId = `cand-int-${ts}`;
const appId = `app-int-${ts}`;
const qId = `q-int-${ts}`;
const sessId = `sess-int-${ts}`;
const token = `test-token-${ts}`;

console.log("\n=== Interview Persistence Test ===\n");

// 1. transcript column exists
console.log("1. Transcript column");
const { error: colErr } = await admin.from("interview_sessions").select("transcript").limit(1);
if (colErr) fail("transcript column on interview_sessions", colErr.message);
else ok("transcript column accessible");

// 2. Seed minimal data
console.log("\n2. Seed test data");
await admin.from("organizations").insert({ id: orgId, name: "Interview Test Org", primary_color: "#000" });
await admin.from("job_roles").insert({
  id: jobId,
  org_id: orgId,
  title: "Interview Test Job",
  description: "Test",
  status: "live",
  eligibility_rules: [],
  passing_score: 6,
  form_fields: [],
});
await admin.from("questions").insert({
  id: qId,
  question_bank_id: "bank-tech",
  job_role_id: jobId,
  section: "technical",
  prompt_text: "Describe your experience with APIs.",
  ideal_answer_notes: "Mentions REST, auth, error handling",
  order_index: 1,
  is_active: true,
  time_limit_seconds: 90,
});
await admin.from("candidates").insert({
  id: candId,
  org_id: orgId,
  name: "Interview Tester",
  email: `interview-test-${ts}@hireloop-test.local`,
  source: "website",
});
const { error: appErr } = await admin.from("applications").insert({
  id: appId,
  candidate_id: candId,
  job_role_id: jobId,
  form_response: { name: "Interview Tester" },
  status: "interview_sent",
  interview_token: token,
  token_expires_at: new Date(Date.now() + 86400000).toISOString(),
});
if (appErr) fail("create application with token", appErr.message);
else ok("application with interview_sent + token");

// 3. Simulate API: load by token
console.log("\n3. Token validation (API store logic)");
const { data: appRows, error: tokErr } = await admin
  .from("applications")
  .select("id,candidate_id,job_role_id,status,token_expires_at")
  .eq("interview_token", token);
if (tokErr || !appRows?.length) fail("load application by token", tokErr?.message ?? "not found");
else if (appRows[0].status !== "interview_sent") fail("application status", appRows[0].status);
else ok("load application by interview_token");

const { data: qRows } = await admin
  .from("questions")
  .select("id,prompt_text,is_active")
  .eq("job_role_id", jobId)
  .eq("is_active", true);
if (!qRows?.length) fail("load active questions", "none found");
else ok(`load ${qRows.length} active question(s)`);

// 4. Create session + save transcript
console.log("\n4. Session + transcript persistence");
const now = new Date().toISOString();
const { error: sessErr } = await admin.from("interview_sessions").insert({
  id: sessId,
  application_id: appId,
  status: "in_progress",
  started_at: now,
  transcript: [],
});
if (sessErr) fail("create interview_session", sessErr.message);
else ok("create interview_session");

await admin.from("applications").update({ status: "interviewed" }).eq("id", appId);

const transcript = [
  { speaker: "ai", text: "Welcome. Describe your experience with APIs.", timestampOffsetSeconds: 0, questionId: qId },
  { speaker: "candidate", text: "I have built REST APIs with auth and error handling.", timestampOffsetSeconds: 12, questionId: qId },
];

const { error: txErr } = await admin
  .from("interview_sessions")
  .update({ transcript })
  .eq("id", sessId);
if (txErr) fail("save transcript", txErr.message);
else ok("save transcript JSONB");

// 5. Finalize + scores
console.log("\n5. Finalize + scoring fields");
const questionScores = [
  { questionId: qId, promptText: "Describe your experience with APIs.", score: 8, rationale: "Solid answer.", redFlags: [] },
];
const overallScore = {
  totalScore: 8,
  pass: true,
  strengths: "Clear communication.",
  concerns: "",
  generatedAt: new Date().toISOString(),
};

const { error: finErr } = await admin
  .from("interview_sessions")
  .update({
    status: "completed",
    ended_at: new Date().toISOString(),
    total_duration_seconds: 45,
    transcript,
    question_scores: questionScores,
    overall_score: overallScore,
  })
  .eq("id", sessId);
if (finErr) fail("finalize session with scores", finErr.message);
else ok("finalize session with scores + transcript");

await admin.from("applications").update({ status: "passed_ai" }).eq("id", appId);

const { data: final } = await admin
  .from("interview_sessions")
  .select("transcript, question_scores, overall_score, status")
  .eq("id", sessId)
  .single();

if (!final?.transcript?.length) fail("read back transcript", "empty");
else if (final.transcript.length !== 2) fail("transcript length", String(final.transcript.length));
else ok(`read back transcript (${final.transcript.length} entries)`);

if (!final?.overall_score?.totalScore) fail("read back overall_score", "missing");
else ok(`overall score = ${final.overall_score.totalScore}/10`);

const { data: finalApp } = await admin.from("applications").select("status").eq("id", appId).single();
if (finalApp?.status !== "passed_ai") fail("application status after scoring", finalApp?.status ?? "null");
else ok("application status → passed_ai");

// 6. API health (optional)
console.log("\n6. Interview API");
try {
  const res = await fetch("http://127.0.0.1:8000/health", { signal: AbortSignal.timeout(3000) });
  if (res.ok) ok(`API health → ${res.status}`);
  else fail("API health", `status ${res.status}`);
} catch {
  console.log("  ⚠ API not running on :8000 (start with: cd apps/api && uvicorn main:app --port 8000)");
}

// Cleanup
console.log("\n7. Cleanup");
await admin.from("interview_sessions").delete().eq("id", sessId);
await admin.from("applications").delete().eq("id", appId);
await admin.from("candidates").delete().eq("id", candId);
await admin.from("questions").delete().eq("job_role_id", jobId);
await admin.from("job_roles").delete().eq("id", jobId);
await admin.from("organizations").delete().eq("id", orgId);
ok("test data cleaned up");

console.log("\n=== Results ===");
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(failed === 0 ? "\n✅ Interview persistence test passed\n" : "\n❌ Some checks failed\n");
process.exit(failed > 0 ? 1 : 0);
