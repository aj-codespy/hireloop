/**
 * HireLoop Supabase integration tests
 * Run: node --env-file=.env.local scripts/test-integration.mjs
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !secret) {
  console.error("FAIL: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY");
  process.exit(1);
}

const admin = createClient(url, secret, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const tests = [];
let passed = 0;
let failed = 0;

function ok(name) {
  tests.push({ name, status: "PASS" });
  passed++;
  console.log(`  ✓ ${name}`);
}

function fail(name, detail) {
  tests.push({ name, status: "FAIL", detail });
  failed++;
  console.error(`  ✗ ${name}: ${detail}`);
}

const testEmail = `test-${Date.now()}@hireloop-test.local`;
const testAdminEmail = `admin-${Date.now()}@hireloop-test.local`;
const testPassword = "TestPass123!";
let orgId;
let jobId;
let candidateUserId;
let profileId;

console.log("\n=== HireLoop Supabase Integration Tests ===\n");

// 1. Tables exist
console.log("1. Schema");
for (const table of [
  "organizations",
  "job_roles",
  "questions",
  "candidates",
  "applications",
  "profiles",
  "organization_members",
]) {
  const { error } = await admin.from(table).select("*", { count: "exact", head: true });
  if (error) fail(`table ${table} exists`, error.message);
  else ok(`table ${table} accessible`);
}

// 2. Admin signup flow
console.log("\n2. Org admin signup");
const { data: adminUser, error: adminCreateErr } = await admin.auth.admin.createUser({
  email: testAdminEmail,
  password: testPassword,
  email_confirm: true,
  app_metadata: { account_type: "org_admin" },
  user_metadata: { full_name: "Test Admin" },
});
if (adminCreateErr) fail("create org_admin user", adminCreateErr.message);
else ok("create org_admin user");

if (adminUser?.user) {
  await new Promise((r) => setTimeout(r, 500));
  // Trigger may default to candidate; mirror app behavior with explicit update
  await admin
    .from("profiles")
    .update({ account_type: "org_admin" })
    .eq("id", adminUser.user.id);
  const { data: profile } = await admin
    .from("profiles")
    .select("*")
    .eq("id", adminUser.user.id)
    .single();
  if (!profile) fail("profile auto-created for admin", "no row");
  else if (profile.account_type !== "org_admin") fail("admin profile type", profile.account_type);
  else ok("profile auto-created with account_type=org_admin");

  orgId = `org-test-${Date.now()}`;
  const { error: orgErr } = await admin.from("organizations").insert({
    id: orgId,
    name: "Test Org Integration",
    primary_color: "#FF6B00",
  });
  if (orgErr) fail("create organization", orgErr.message);
  else ok("create organization");

  const { error: memberErr } = await admin.from("organization_members").insert({
    id: `om-test-${Date.now()}`,
    org_id: orgId,
    user_id: adminUser.user.id,
    role: "owner",
  });
  if (memberErr) fail("create organization_member", memberErr.message);
  else ok("link admin to organization");
}

// 3. Create job + questions
console.log("\n3. Job creation");
jobId = `job-test-${Date.now()}`;
const { error: jobErr } = await admin.from("job_roles").insert({
  id: jobId,
  org_id: orgId,
  title: "Integration Test Role",
  description: "Auto test job",
  status: "live",
  eligibility_rules: [],
  passing_score: null,
  form_fields: [
    { id: "f1", fieldKey: "name", label: "Name", type: "text", required: true, order: 1 },
    { id: "f2", fieldKey: "email", label: "Email", type: "email", required: true, order: 2 },
  ],
});
if (jobErr) fail("create job_role", jobErr.message);
else ok("create job_role");

const { error: qErr } = await admin.from("questions").insert({
  id: `q-test-${Date.now()}`,
  question_bank_id: "bank-tech",
  job_role_id: jobId,
  section: "technical",
  prompt_text: "Test question?",
  ideal_answer_notes: "",
  order_index: 1,
  is_active: true,
});
if (qErr) fail("create question", qErr.message);
else ok("create question");

// 4. Candidate signup
console.log("\n4. Candidate signup");
const { data: candUser, error: candCreateErr } = await admin.auth.admin.createUser({
  email: testEmail,
  password: testPassword,
  email_confirm: true,
  app_metadata: { account_type: "candidate" },
  user_metadata: { full_name: "Test Candidate" },
});
if (candCreateErr) fail("create candidate user", candCreateErr.message);
else ok("create candidate user");

if (candUser?.user) {
  candidateUserId = candUser.user.id;
  profileId = candUser.user.id;
  await new Promise((r) => setTimeout(r, 500));
  const { data: cProfile } = await admin
    .from("profiles")
    .select("*")
    .eq("id", candidateUserId)
    .single();
  if (!cProfile || cProfile.account_type !== "candidate") fail("candidate profile", "missing or wrong type");
  else ok("candidate profile created");
}

// 5. Application dedupe by email
console.log("\n5. Candidate dedupe (same email → one candidate row)");
const candId1 = `cand-test-${Date.now()}`;
const { error: c1Err } = await admin.from("candidates").insert({
  id: candId1,
  org_id: orgId,
  profile_id: profileId,
  name: "Test Candidate",
  email: testEmail,
  source: "website",
});
if (c1Err) fail("insert candidate 1", c1Err.message);
else ok("insert first candidate");

const appId1 = `app-test-1-${Date.now()}`;
const { error: app1Err } = await admin.from("applications").insert({
  id: appId1,
  candidate_id: candId1,
  job_role_id: jobId,
  form_response: { name: "Test Candidate", email: testEmail },
  status: "applied",
});
if (app1Err) fail("insert application 1", app1Err.message);
else ok("insert first application");

// Simulate findOrCreate: lookup by email
const { data: existing } = await admin
  .from("candidates")
  .select("*")
  .ilike("email", testEmail)
  .maybeSingle();

if (!existing || existing.id !== candId1) fail("find candidate by email", "not found or wrong id");
else ok("find existing candidate by email");

// Second application should reuse same candidate id
const appId2 = `app-test-2-${Date.now()}`;
const jobId2 = `job-test-2-${Date.now()}`;
await admin.from("job_roles").insert({
  id: jobId2,
  org_id: orgId,
  title: "Second Test Role",
  description: "Another job",
  status: "live",
  eligibility_rules: [],
  form_fields: [],
});

const { error: app2Err } = await admin.from("applications").insert({
  id: appId2,
  candidate_id: existing.id,
  job_role_id: jobId2,
  form_response: { email: testEmail },
  status: "applied",
});
if (app2Err) fail("insert second application (same candidate)", app2Err.message);
else ok("second job linked to same candidate id");

const { count } = await admin
  .from("candidates")
  .select("*", { count: "exact", head: true })
  .ilike("email", testEmail);
if (count !== 1) fail("only one candidate row per email", `count=${count}`);
else ok("only one candidate row for email");

const { data: apps } = await admin
  .from("applications")
  .select("id")
  .eq("candidate_id", existing.id);
if (!apps || apps.length < 2) fail("two applications on one candidate", `count=${apps?.length}`);
else ok(`candidate has ${apps.length} applications across jobs`);

// 6. Auth sign-in
console.log("\n6. Auth sign-in");
const publishable =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (publishable) {
  const client = createClient(url, publishable);
  const { data: signIn, error: signInErr } = await client.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });
  if (signInErr) fail("candidate sign-in", signInErr.message);
  else if (!signIn.session) fail("candidate sign-in", "no session");
  else ok("candidate sign-in works");
  await client.auth.signOut();
} else {
  fail("publishable key for sign-in test", "not set");
}

// 7. App routes reachable
console.log("\n7. App routes (dev server)");
const routes = [
  "/",
  "/admin/login",
  "/candidate/login",
  "/candidate/signup",
  "/admin/jobs",
];
for (const route of routes) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`http://127.0.0.1:3000${route}`, {
      redirect: "manual",
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (res.status >= 200 && res.status < 400) ok(`GET ${route} → ${res.status}`);
    else fail(`GET ${route}`, `status ${res.status}`);
  } catch (e) {
    fail(`GET ${route}`, e.name === "AbortError" ? "timeout (is npm run dev running?)" : e.message);
  }
}

// Cleanup test data
console.log("\n8. Cleanup");
if (appId1) await admin.from("applications").delete().eq("candidate_id", candId1);
if (candId1) await admin.from("candidates").delete().eq("id", candId1);
if (jobId) {
  await admin.from("questions").delete().eq("job_role_id", jobId);
  await admin.from("job_roles").delete().eq("id", jobId);
}
if (jobId2) await admin.from("job_roles").delete().eq("id", jobId2);
if (orgId) {
  await admin.from("organization_members").delete().eq("org_id", orgId);
  await admin.from("organizations").delete().eq("id", orgId);
}
if (candidateUserId) await admin.auth.admin.deleteUser(candidateUserId);
if (adminUser?.user?.id) await admin.auth.admin.deleteUser(adminUser.user.id);
ok("test data cleaned up");

// Summary
console.log("\n=== Results ===");
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(failed === 0 ? "\n✅ All tests passed\n" : "\n❌ Some tests failed\n");
process.exit(failed > 0 ? 1 : 0);
