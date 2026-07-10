#!/usr/bin/env node
/**
 * Seeds demo org data + auth users for local QA.
 *
 * Requires SUPABASE_URL and SUPABASE_SECRET_KEY in apps/web/.env.local
 * Apply migration 20260706180000_mandatory_variable_questions.sql first.
 *
 *   node scripts/seed-test-users.mjs
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
loadEnvFile(resolve(root, "apps/api/.env"));

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const secret =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !secret) {
  console.error("Missing SUPABASE_URL and SUPABASE_SECRET_KEY in env.");
  process.exit(1);
}

const supabase = createClient(url, secret, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const PASSWORD = "TestPass123!";
const ORG_ID = "org-1";

const USERS = [
  {
    email: "admin@hireloop.test",
    fullName: "Alex Admin",
    accountType: "org_admin",
    memberRole: "owner",
    memberId: "mem-admin-1",
  },
  ...[
    "priya.test@hireloop.local",
    "arjun.test@hireloop.local",
    "sneha.test@hireloop.local",
    "rahul.test@hireloop.local",
    "ananya.test@hireloop.local",
    "vikram.test@hireloop.local",
    "meera.test@hireloop.local",
  ].map((email, i) => ({
    email,
    fullName: email.split("@")[0].replace(".", " "),
    accountType: "candidate",
    candidateId: `cand-${i + 1}`,
  })),
];

async function ensureUser(user) {
  const { data: listed, error: listError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (listError) throw listError;

  const existing = listed.users.find(
    (u) => u.email?.toLowerCase() === user.email.toLowerCase()
  );

  if (existing) {
    console.log(`✓ ${user.email} (exists)`);
    return existing.id;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: user.email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: user.fullName },
    app_metadata: { account_type: user.accountType },
  });
  if (error) throw error;
  console.log(`+ ${user.email} created`);
  return data.user.id;
}

async function ensureDemoData() {
  console.log("Seeding org, job, questions, candidates…\n");

  const { error: orgError } = await supabase.from("organizations").upsert(
    {
      id: ORG_ID,
      name: "RRCO",
      primary_color: "#FF6B00",
      intro_video_url: "https://www.youtube.com/embed/VCPGMjCW0is",
      website: "https://rrco.example.com",
      about:
        "RRCO is a mid-market audit and advisory firm hiring graduate talent across India.",
      created_at: "2026-06-01T10:00:00Z",
    },
    { onConflict: "id" }
  );
  if (orgError) throw orgError;

  const formFields = [
    { id: "f1", fieldKey: "name", label: "Full name", type: "text", required: true, order: 1 },
    { id: "f2", fieldKey: "email", label: "Email", type: "email", required: true, order: 2 },
    { id: "f3", fieldKey: "phone", label: "Phone", type: "phone", required: true, order: 3 },
    {
      id: "f4",
      fieldKey: "ca_attempt",
      label: "CA attempts so far",
      type: "number",
      required: true,
      order: 4,
    },
    {
      id: "f5",
      fieldKey: "grad_score",
      label: "Graduation score (%)",
      type: "number",
      required: true,
      order: 5,
    },
    { id: "f6", fieldKey: "resume", label: "Resume", type: "doc", required: true, order: 6 },
  ];

  let jobPayload = {
    id: "job-1",
    org_id: ORG_ID,
    title: "Graduate Accountant — Audit Track",
    description:
      "Entry-level role for CA-intermediate candidates joining our audit practice.",
    status: "live",
    eligibility_rules: [
      { fieldKey: "ca_attempt", label: "CA attempts", operator: "<=", value: 2 },
      { fieldKey: "grad_score", label: "Graduation %", operator: ">=", value: 60 },
    ],
    passing_score: 7.0,
    interview_question_count: 8,
    form_fields: formFields,
    created_at: "2026-06-01T10:00:00Z",
    updated_at: "2026-06-01T10:00:00Z",
  };

  let { error: jobError } = await supabase.from("job_roles").upsert(jobPayload, {
    onConflict: "id",
  });
  if (jobError?.message?.includes("interview_question_count")) {
    console.warn(
      "⚠ Migration 20260706180000 not applied — seeding job without interview_question_count."
    );
    const { interview_question_count: _drop, ...legacyJob } = jobPayload;
    jobPayload = legacyJob;
    ({ error: jobError } = await supabase.from("job_roles").upsert(jobPayload, {
      onConflict: "id",
    }));
  }
  if (jobError) throw jobError;

  const questions = [
    ["q1", "technical", "Walk me through how you would reconcile a bank statement against a general ledger.", "Matching, unmatched items, timing differences, escalation.", 90, 1, true],
    ["q2", "technical", "How do you assess materiality when you find a discrepancy during an audit?", "Quantitative thresholds, qualitative factors, documentation.", 75, 2, false],
    ["q3", "technical", "Explain the difference between accrual and cash basis accounting with an example.", "Revenue recognition, expense matching, timing.", 75, 3, false],
    ["q4", "technical", "How would you test internal controls around vendor payments?", "Segregation of duties, authorization, three-way match.", 90, 4, false],
    ["q5", "situational", "Tell me about a time you met a tight deadline while maintaining accuracy.", "STAR format, prioritization, quality controls.", 75, 5, true],
    ["q6", "situational", "Describe a situation where you had to push back on a senior colleague.", "Respectful disagreement, evidence-based reasoning.", 75, 6, false],
    ["q7", "situational", "How do you handle conflicting priorities from two managers?", "Communication, escalation, documentation.", 75, 7, false],
    ["q8", "situational", "Tell me about a mistake you caught before it reached the client.", "Ownership, remediation, preventive controls.", 75, 8, false],
    ["q9", "hr", "Why this role, and what do you hope to learn in your first six months?", "Genuine motivation, realistic learning goals.", 60, 9, true],
    ["q10", "hr", "Where do you see yourself in three years within audit or advisory?", "Career intent, realism, growth mindset.", 60, 10, false],
    ["q11", "technical", "What is your approach to learning a new accounting standard quickly?", "Primary sources, examples, asking experts.", 75, 11, false],
    ["q12", "hr", "What kind of team culture helps you do your best work?", "Collaboration, feedback, psychological safety.", 60, 12, false],
  ].map(([id, section, prompt, notes, seconds, order, mandatory]) => ({
    id,
    question_bank_id: `bank-${section}`,
    job_role_id: "job-1",
    section,
    prompt_text: prompt,
    ideal_answer_notes: notes,
    time_limit_seconds: seconds,
    score_threshold: null,
    order_index: order,
    is_active: true,
    is_mandatory: mandatory,
  }));

  let { error: qError } = await supabase.from("questions").upsert(questions, { onConflict: "id" });
  if (qError?.message?.includes("is_mandatory")) {
    console.warn("⚠ Seeding questions without is_mandatory (apply migration for variable pools).");
    const legacyQuestions = questions.map(({ is_mandatory: _drop, ...rest }) => rest);
    ({ error: qError } = await supabase.from("questions").upsert(legacyQuestions, {
      onConflict: "id",
    }));
  }
  if (qError) throw qError;

  const candidates = [
    ["cand-1", "Priya Sharma", "priya.test@hireloop.local", "+91 98765 43210", "campus"],
    ["cand-2", "Arjun Mehta", "arjun.test@hireloop.local", "+91 91234 56789", "referral"],
    ["cand-3", "Sneha Reddy", "sneha.test@hireloop.local", "+91 99887 76655", "website"],
    ["cand-4", "Rahul Kapoor", "rahul.test@hireloop.local", "+91 90000 11122", "campus"],
    ["cand-5", "Ananya Iyer", "ananya.test@hireloop.local", "+91 91122 33445", "linkedin"],
    ["cand-6", "Vikram Singh", "vikram.test@hireloop.local", "+91 92233 44556", "referral"],
    ["cand-7", "Meera Nair", "meera.test@hireloop.local", "+91 93344 55667", "campus"],
  ].map(([id, name, email, phone, source]) => ({
    id,
    org_id: ORG_ID,
    name,
    email,
    phone,
    source,
    created_at: "2026-06-20T08:00:00Z",
  }));

  const { error: candError } = await supabase.from("candidates").upsert(candidates, {
    onConflict: "id",
  });
  if (candError) throw candError;

  const applications = [
    ["app-1", "cand-1", "shortlisted", null, { name: "Priya Sharma", email: "priya.test@hireloop.local", phone: "+91 98765 43210", ca_attempt: 1, grad_score: 72 }],
    ["app-2", "cand-2", "interview_sent", "demo-token-arjun", { name: "Arjun Mehta", email: "arjun.test@hireloop.local", phone: "+91 91234 56789", ca_attempt: 2, grad_score: 68 }],
    ["app-3", "cand-3", "applied", null, { name: "Sneha Reddy", email: "sneha.test@hireloop.local", phone: "+91 99887 76655", ca_attempt: 1, grad_score: 81 }],
    ["app-4", "cand-4", "interview_sent", "demo-token-rahul", { name: "Rahul Kapoor", email: "rahul.test@hireloop.local", phone: "+91 90000 11122", ca_attempt: 1, grad_score: 74 }],
    ["app-5", "cand-5", "auto_rejected", null, { name: "Ananya Iyer", email: "ananya.test@hireloop.local", phone: "+91 91122 33445", ca_attempt: 0, grad_score: 55 }],
    ["app-6", "cand-6", "passed_ai", null, { name: "Vikram Singh", email: "vikram.test@hireloop.local", phone: "+91 92233 44556", ca_attempt: 1, grad_score: 77 }],
    ["app-7", "cand-7", "applied", null, { name: "Meera Nair", email: "meera.test@hireloop.local", phone: "+91 93344 55667", ca_attempt: 1, grad_score: 70 }],
  ].map(([id, candidate_id, status, token, form_response]) => ({
    id,
    candidate_id,
    job_role_id: "job-1",
    form_response,
    status,
    interview_token: token,
    token_expires_at: token ? "2026-08-01T00:00:00Z" : null,
    created_at: "2026-06-20T08:30:00Z",
  }));

  const { error: appError } = await supabase.from("applications").upsert(applications, {
    onConflict: "id",
  });
  if (appError) throw appError;

  console.log("✓ Demo data ready (1 job, 12 questions, 7 candidates)\n");
}

async function main() {
  await ensureDemoData();
  console.log("Seeding test users…\n");

  for (const user of USERS) {
    const userId = await ensureUser(user);

    if (user.accountType === "org_admin") {
      const { error } = await supabase.from("organization_members").upsert(
        {
          id: user.memberId,
          org_id: ORG_ID,
          user_id: userId,
          role: user.memberRole,
        },
        { onConflict: "id" }
      );
      if (error) throw error;
      await supabase
        .from("profiles")
        .update({ account_type: "org_admin", full_name: user.fullName })
        .eq("id", userId);
      console.log(`  linked to ${ORG_ID} as ${user.memberRole}`);
    }

    if (user.candidateId) {
      const { error } = await supabase
        .from("candidates")
        .update({ profile_id: userId })
        .eq("id", user.candidateId);
      if (error) throw error;
      await supabase
        .from("profiles")
        .update({ account_type: "candidate", full_name: user.fullName, email: user.email })
        .eq("id", userId);
      console.log(`  linked candidate ${user.candidateId}`);
    }
  }

  console.log("\nDone. Login credentials:");
  console.log(`  Admin:     admin@hireloop.test / ${PASSWORD}`);
  console.log(`  Candidate: priya.test@hireloop.local / ${PASSWORD}`);
  console.log(`  Interview: http://localhost:3000/interview/demo-token-rahul`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
