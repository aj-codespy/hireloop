#!/usr/bin/env node
/**
 * Pre-render TTS audio for all active questions and store in Supabase Storage.
 * Run after migration: node scripts/render-question-audio.mjs
 */
import { createRequire } from "node:module";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
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

loadEnvFile(resolve(root, "apps/api/.env"));
loadEnvFile(resolve(root, "apps/web/.env.local"));

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const secret = process.env.INTERVIEW_INTERNAL_SECRET || "";

async function main() {
  if (!secret) {
    console.error("Set INTERVIEW_INTERNAL_SECRET in apps/api/.env");
    process.exit(1);
  }

  const { createClient } = require(resolve(
    __dirname,
    "../apps/web/node_modules/@supabase/supabase-js"
  ));
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Missing Supabase credentials");
    process.exit(1);
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { data: questions, error } = await supabase
    .from("questions")
    .select("id,prompt_text,audio_url,audio_url_hi")
    .eq("is_active", true);

  if (error) throw error;
  const ids = (questions ?? []).map((q) => q.id);
  if (!ids.length) {
    console.log("No active questions found.");
    return;
  }

  console.log(`Rendering audio for ${ids.length} question(s)...`);
  const res = await fetch(`${apiUrl}/admin/questions/render-audio`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Internal-Secret": secret,
    },
    body: JSON.stringify({ question_ids: ids, langs: ["en", "hi"] }),
  });

  if (!res.ok) {
    console.error(await res.text());
    process.exit(1);
  }

  const body = await res.json();
  console.log("Done:", JSON.stringify(body.rendered, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
