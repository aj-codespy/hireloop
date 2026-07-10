/** Fix admin profile account_type if mis-set. Run: node --env-file=.env.local scripts/fix-admin-profile.mjs */
import { createClient } from "@supabase/supabase-js";

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false },
});

const { data: users } = await admin.auth.admin.listUsers({ perPage: 100 });
const user = users.users.find((u) => u.email === "admin@hireloop.test");
if (!user) {
  console.error("admin@hireloop.test not found");
  process.exit(1);
}

const { error } = await admin
  .from("profiles")
  .update({
    account_type: "org_admin",
    full_name: "Alex Admin",
    email: "admin@hireloop.test",
    updated_at: new Date().toISOString(),
  })
  .eq("id", user.id);

if (error) {
  console.error(error);
  process.exit(1);
}
console.log("Fixed admin profile for", user.id);
