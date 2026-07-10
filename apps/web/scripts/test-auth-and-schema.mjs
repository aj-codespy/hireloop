/**
 * Post-change verification: schema, auth routes, token fetch
 * Run: node --env-file=.env.local scripts/test-auth-and-schema.mjs
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
const web = process.env.NEXT_PUBLIC_APP_URL ?? "http://127.0.0.1:3000";

if (!url || !secret) {
  console.error("Missing Supabase env");
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

console.log("\n=== Auth & Schema Verification ===\n");

console.log("1. New schema columns");
const { error: procColErr } = await admin
  .from("interview_sessions")
  .select("proctoring_log, proctoring_summary")
  .limit(1);
if (procColErr) fail("proctoring columns", procColErr.message);
else ok("proctoring_log + proctoring_summary columns");

console.log("\n2. Storage bucket");
const { data: buckets } = await admin.storage.listBuckets();
const snapBucket = buckets?.find((b) => b.name === "proctoring-snapshots");
if (snapBucket) ok(`proctoring-snapshots bucket (public=${snapBucket.public})`);
else fail("proctoring-snapshots bucket", "not found");

console.log("\n3. final_interviewer role (org member insert)");
const testOrgId = `org-test-${Date.now()}`;
const testUserId = crypto.randomUUID();
try {
  await admin.from("organizations").insert({
    id: testOrgId,
    name: "Role Test Org",
    primary_color: "#000",
    created_at: new Date().toISOString(),
  });
  await admin.from("profiles").insert({
    id: testUserId,
    account_type: "partner",
    email: `fi-test-${Date.now()}@test.local`,
    full_name: "FI Tester",
  });
  const { error: memberErr } = await admin.from("organization_members").insert({
    id: `om-test-${Date.now()}`,
    org_id: testOrgId,
    user_id: testUserId,
    role: "final_interviewer",
    created_at: new Date().toISOString(),
  });
  if (memberErr) fail("final_interviewer role", memberErr.message);
  else ok("final_interviewer org member role accepted");
} catch (e) {
  fail("final_interviewer role", String(e));
} finally {
  await admin.from("organization_members").delete().eq("org_id", testOrgId);
  await admin.from("profiles").delete().eq("id", testUserId);
  await admin.from("organizations").delete().eq("id", testOrgId);
}

console.log("\n4. Route protection & legacy redirects (middleware)");
const checks = [
  ["/admin/jobs", 307, "admin protected"],
  ["/admin/candidates", 307, "admin protected"],
  ["/admin/login", 200, "admin login public"],
  ["/final-interview", 307, "legacy final-interview → admin"],
  ["/partner", 307, "legacy partner → admin"],
];

for (const [path, expected, label] of checks) {
  try {
    const res = await fetch(`${web}${path}`, { redirect: "manual" });
    if (res.status === expected) ok(`${label} (${path} → ${res.status})`);
    else fail(label, `${path} expected ${expected}, got ${res.status}`);
  } catch (e) {
    fail(label, String(e));
  }
}

console.log("\n5. Legacy portal redirect targets");
try {
  const res = await fetch(`${web}/partner/login`, { redirect: "manual" });
  const loc = res.headers.get("location") ?? "";
  if (loc.includes("/admin/login")) ok("/partner/login redirects to /admin/login");
  else fail("partner redirect", `location=${loc}`);
} catch (e) {
  fail("partner redirect", String(e));
}

console.log("\n=== Results ===");
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
process.exit(failed > 0 ? 1 : 0);
