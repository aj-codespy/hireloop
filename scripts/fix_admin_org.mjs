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
    // get admin user
    const { data: profile } = await supabase.from("profiles").select("id").eq("email", "admin@hireloop.test").single();
    if (!profile) throw new Error("Admin not found");
    
    // add admin to org
    const { error } = await supabase.from("organization_members").upsert({
        id: "mem-admin-test-org-ca",
        org_id: "org-test-1783102956277",
        user_id: profile.id,
        role: "owner"
    }, { onConflict: "id" });
    
    if (error) throw error;
    console.log("Admin successfully added to the CA org!");
}

main().catch(console.error);
