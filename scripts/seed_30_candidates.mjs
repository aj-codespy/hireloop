#!/usr/bin/env node
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
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(resolve(root, "apps/web/.env.local"));
loadEnvFile(resolve(root, "apps/api/.env"));

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !secret) {
  console.error("Missing SUPABASE_URL and SUPABASE_SECRET_KEY in env.");
  process.exit(1);
}

const supabase = createClient(url, secret, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const JOB_ID = "job-0f3dd8fb-4acb-454f-8ab6-91cdec9cf7a8";
const PASSWORD = "TestPass123!";

async function main() {
  console.log("Adding 30 candidates to job " + JOB_ID);
  
  const { data: jobData } = await supabase.from("job_roles").select("org_id").eq("id", JOB_ID).single();
  if (!jobData) throw new Error("Could not find job role");
  
  const ORG_ID = jobData.org_id;
  
  for (let i = 1; i <= 30; i++) {
    const email = `test${i}@hireloop.test`;
    
    let userId = null;
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: `test${i}` },
      app_metadata: { account_type: "candidate" },
    });
    
    if (userError) {
      if (userError.code === 'email_exists' || userError.message.includes("already been registered") || userError.message.includes("already registered")) {
         const { data: profile } = await supabase.from("profiles").select("id").eq("email", email).single();
         if (profile) {
             userId = profile.id;
         }
      } else {
        throw userError;
      }
    } else {
      userId = userData.user.id;
    }
    
    if (userId) {
        await supabase.from("profiles").update({
            full_name: `test${i}`,
            account_type: 'candidate'
        }).eq("id", userId);
    }
    
    const candId = `cand-test-${i}`;
    const candPayload = {
      id: candId,
      org_id: ORG_ID,
      name: `test${i}`,
      email: email,
      phone: "+1 555 0000",
      source: "bulk_seed",
      created_at: new Date().toISOString(),
    };
    
    const { error: candError } = await supabase.from("candidates").upsert(candPayload, { onConflict: "id" });
    if (candError) throw candError;
    
    const appId = `app-test-${i}`;
    const appPayload = {
      id: appId,
      candidate_id: candId,
      job_role_id: JOB_ID,
      status: "interview_sent",
      interview_token: `token-test-${i}`,
      created_at: new Date().toISOString(),
    };
    
    const { error: appError } = await supabase.from("applications").upsert(appPayload, { onConflict: "id" });
    if (appError) throw appError;
    
    console.log(`Candidate ${i} added. Email: ${email}, Pass: ${PASSWORD}, Token: token-test-${i}`);
  }
  
  console.log("Done adding 30 candidates.");
}

main().catch(console.error);
