import pg from 'pg';
import dns from 'dns';

// Patch dns.lookup to resolve pooler host to our chosen IP
const target_ip = "35.79.125.133";
const original_lookup = dns.lookup;
dns.lookup = function(hostname, options, callback) {
  if (hostname === "aws-0-ap-northeast-1.pooler.supabase.com") {
    if (typeof options === 'function') {
      return options(null, target_ip, 4);
    }
    return callback(null, target_ip, 4);
  }
  return original_lookup(hostname, options, callback);
};

const host = "aws-0-ap-northeast-1.pooler.supabase.com";
const user = "postgres.xiniaecawuieywlnopry";
const passwords = [
  "Cxx4d_CSXL3mFq6dUUyXLg_BjJsRSLX",
  "sb_secret_Cxx4d_CSXL3mFq6dUUyXLg_BjJsRSLX",
  "super_secret_local_dev_key_123!"
];
const database = "postgres";

async function test(pwd) {
  const client = new pg.Client({
    host,
    port: 6543,
    user,
    password: pwd,
    database,
    ssl: { rejectUnauthorized: false }
  });
  try {
    await client.connect();
    console.log(`★ SUCCESS with password: ${pwd}`);
    const res = await client.query('SELECT 1');
    console.log(`Query returned: ${res.rows[0]['?column?'] || JSON.stringify(res.rows[0])}`);
    await client.end();
    return true;
  } catch (e) {
    console.log(`FAIL with password: ${pwd} -> ${e.message}`);
    return false;
  }
}

async function main() {
  for (const pwd of passwords) {
    await test(pwd);
  }
}

main();
