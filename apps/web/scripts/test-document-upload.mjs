/**
 * Document upload storage test
 * Run: node --env-file=.env.local scripts/test-document-upload.mjs
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;

if (!url || !secret) {
  console.error("Missing Supabase env");
  process.exit(1);
}

const admin = createClient(url, secret, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const BUCKET = "application-files";
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

console.log("\n=== Document Upload Storage Test ===\n");

// 1. Bucket exists
console.log("1. Bucket");
const { data: buckets, error: listErr } = await admin.storage.listBuckets();
if (listErr) fail("list buckets", listErr.message);
else {
  const bucket = buckets?.find((b) => b.name === BUCKET);
  if (bucket) ok(`bucket "${BUCKET}" exists (public=${bucket.public})`);
  else fail("bucket exists", `"${BUCKET}" not found — create it in Supabase Storage`);
}

// 2. Upload + signed URL
console.log("\n2. Upload & signed URL");
const testPath = `org-test/job-test/app-test/resume-test.pdf`;
const pdfContent = Buffer.from("%PDF-1.4 test resume content");
const { error: upErr } = await admin.storage.from(BUCKET).upload(testPath, pdfContent, {
  contentType: "application/pdf",
  upsert: true,
});
if (upErr) fail("upload test file", upErr.message);
else ok("upload test PDF");

const { data: signed, error: signErr } = await admin.storage
  .from(BUCKET)
  .createSignedUrl(testPath, 300);
if (signErr || !signed?.signedUrl) fail("create signed URL", signErr?.message ?? "no url");
else ok("create signed download URL");

// 3. Structured columns
console.log("\n3. Structured interview columns");
const { error: colErr } = await admin
  .from("interview_sessions")
  .select("current_question_index,language,reconnect_expires_at")
  .limit(1);
if (colErr) fail("structured interview columns", colErr.message);
else ok("structured interview columns accessible");

// Cleanup
await admin.storage.from(BUCKET).remove([testPath]);
ok("test file cleaned up");

console.log("\n=== Results ===");
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
process.exit(failed > 0 ? 1 : 0);
