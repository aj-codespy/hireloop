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

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, secret, { auth: { autoRefreshToken: false, persistSession: false } });

async function main() {
    const JOB_ID = "job-0f3dd8fb-4acb-454f-8ab6-91cdec9cf7a8";
    const { data: job } = await supabase.from("job_roles").select("*").eq("id", JOB_ID).single();
    console.log("Job data:", job);
    
    // check organizations
    const { data: orgs } = await supabase.from("organizations").select("*");
    console.log("Orgs:", orgs);
}

main().catch(console.error);
