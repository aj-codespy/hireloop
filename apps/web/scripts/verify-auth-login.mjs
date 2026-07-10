/**
 * Verify password auth for seeded test accounts.
 * Run: node --env-file=.env.local scripts/verify-auth-login.mjs
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secret = process.env.SUPABASE_SECRET_KEY;

if (!url || !key || !secret) {
  console.error("Missing Supabase env");
  process.exit(1);
}

const pub = createClient(url, key, { auth: { persistSession: false } });
const admin = createClient(url, secret, { auth: { persistSession: false } });

const cases = [
  { email: "admin@hireloop.test", password: "TestPass123!", type: "org_admin" },
  { email: "priya.test@hireloop.local", password: "TestPass123!", type: "candidate" },
];

let failed = 0;

console.log("\n=== Auth login verification ===\n");

for (const c of cases) {
  const { data, error } = await pub.auth.signInWithPassword({
    email: c.email,
    password: c.password,
  });
  if (error) {
    failed++;
    console.error(`✗ ${c.email}: ${error.message}`);
    continue;
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("account_type")
    .eq("id", data.user.id)
    .single();

  if (profile?.account_type !== c.type) {
    failed++;
    console.error(`✗ ${c.email}: wrong account_type ${profile?.account_type}`);
  } else {
    console.log(`✓ ${c.email} (${c.type})`);
  }
  await pub.auth.signOut();
}

console.log(failed ? `\nFailed: ${failed}` : "\nAll password logins OK.");
process.exit(failed ? 1 : 0);
