#!/usr/bin/env node
/**
 * Reset a test candidate so their interview can be retaken.
 * Deletes their interview sessions/scores and restores status to interview_sent.
 *
 * Run: node scripts/reset-interview-test.mjs demo-token-rahul
 *      node scripts/reset-interview-test.mjs            (resets all demo-token-* apps)
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

if (!url || !secret) {
  console.error("Missing Supabase env in apps/web/.env.local");
  process.exit(1);
}

const supabase = createClient(url, secret, { auth: { persistSession: false } });

async function main() {
  const token = process.argv[2];

  let query = supabase
    .from("applications")
    .select("id, status, interview_token, candidates(name)");
  query = token
    ? query.eq("interview_token", token)
    : query.like("interview_token", "demo-token-%");

  const { data: apps, error } = await query;
  if (error) throw error;
  if (!apps?.length) {
    console.error(token ? `No application with token ${token}` : "No demo applications found");
    process.exit(1);
  }

  for (const app of apps) {
    const { data: sessions } = await supabase
      .from("interview_sessions")
      .select("id")
      .eq("application_id", app.id);
    const sessionIds = (sessions ?? []).map((s) => s.id);

    if (sessionIds.length) {
      // Child rows first (ignore errors for tables that may not exist).
      for (const table of ["interview_scores", "proctoring_events"]) {
        await supabase.from(table).delete().in("session_id", sessionIds);
      }
      await supabase.from("interview_sessions").delete().in("id", sessionIds);
    }

    const { error: updateError } = await supabase
      .from("applications")
      .update({
        status: "interview_sent",
        token_expires_at: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
      })
      .eq("id", app.id);
    if (updateError) throw updateError;

    console.log(
      `✓ Reset ${app.candidates?.name ?? app.id} (${app.interview_token}) — removed ${sessionIds.length} session(s), status → interview_sent`
    );
  }
  console.log("\nDone. Interview links are ready to use again.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
