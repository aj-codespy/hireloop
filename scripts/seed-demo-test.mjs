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

const ORG_ID = "org-1";

async function main() {
  console.log("Seeding Demo Job...");
  const jobPayload = {
    id: "job-demo",
    org_id: ORG_ID,
    title: "Demo Short Test",
    description: "A quick 3-question test for demonstration purposes.",
    status: "live",
    passing_score: 5.0,
    interview_question_count: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { error: jobError } = await supabase.from("job_roles").upsert(jobPayload, { onConflict: "id" });
  if (jobError) throw jobError;

  console.log("Seeding Demo Questions...");
  const questions = [
    {
      id: "q-demo-1",
      question_bank_id: "bank-demo",
      job_role_id: "job-demo",
      section: "technical",
      prompt_text: "What are your primary strengths and how do they align with this role?",
      ideal_answer_notes: "Looking for self-awareness, relevant skills, and alignment with company goals.",
      time_limit_seconds: 60,
      order_index: 1,
      is_active: true,
      is_mandatory: true,
    },
    {
      id: "q-demo-2",
      question_bank_id: "bank-demo",
      job_role_id: "job-demo",
      section: "situational",
      prompt_text: "Tell me about a time you had to learn a new skill quickly to complete a task.",
      ideal_answer_notes: "Adaptability, quick learning, resourcefulness, successful outcome.",
      time_limit_seconds: 60,
      order_index: 2,
      is_active: true,
      is_mandatory: true,
    },
    {
      id: "q-demo-3",
      question_bank_id: "bank-demo",
      job_role_id: "job-demo",
      section: "hr",
      prompt_text: "Where do you see your career heading in the next three years?",
      ideal_answer_notes: "Ambition, realistic goals, commitment to growth.",
      time_limit_seconds: 60,
      order_index: 3,
      is_active: true,
      is_mandatory: true,
    }
  ];

  const { error: qError } = await supabase.from("questions").upsert(questions, { onConflict: "id" });
  if (qError) throw qError;

  console.log("Seeding Demo Candidate...");
  const candPayload = {
    id: "cand-demo-1",
    org_id: ORG_ID,
    name: "Demo Tester",
    email: "tester@hireloop.local",
    phone: "+1 555 0199",
    source: "demo",
    created_at: new Date().toISOString(),
  };

  const { error: candError } = await supabase.from("candidates").upsert(candPayload, { onConflict: "id" });
  if (candError) throw candError;

  console.log("Seeding Demo Application...");
  const appPayload = {
    id: "app-demo-1",
    candidate_id: "cand-demo-1",
    job_role_id: "job-demo",
    status: "interview_sent",
    interview_token: "demo-token-tester",
    created_at: new Date().toISOString(),
  };

  const { error: appError } = await supabase.from("applications").upsert(appPayload, { onConflict: "id" });
  if (appError) throw appError;

  console.log("✅ Demo seed complete! Token: demo-token-tester");
}

main().catch(console.error);
