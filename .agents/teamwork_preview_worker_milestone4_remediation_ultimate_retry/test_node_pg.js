import pg from 'pg';

const host = "34.160.222.181";
const user = "postgres.xiniaecawuieywlnopry";
const password = "Cxx4d_CSXL3mFq6dUUyXLg_BjJsRSLX";
const database = "postgres";

async function test(port, ssl) {
  const client = new pg.Client({
    host,
    port,
    user,
    password,
    database,
    ssl: ssl
  });
  try {
    await client.connect();
    console.log(`★ SUCCESS: port=${port}, ssl=${JSON.stringify(ssl)}`);
    const res = await client.query('SELECT 1');
    console.log(`Query returned: ${res.rows[0]['?column?'] || JSON.stringify(res.rows[0])}`);
    await client.end();
    return true;
  } catch (e) {
    console.log(`FAIL: port=${port}, ssl=${JSON.stringify(ssl)} -> ${e.message}`);
    return false;
  }
}

async function main() {
  const ssl_opts = [
    { rejectUnauthorized: false },
    true,
    false,
    undefined
  ];
  for (const port of [5432, 6543]) {
    for (const ssl of ssl_opts) {
      await test(port, ssl);
    }
  }
}

main();
