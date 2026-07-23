#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '../../..');

// Helper to parse key-value pairs from .env
function loadEnv(envPath) {
  const env = {};
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      env[key] = value;
    }
  }
  return env;
}

async function run() {
  // Load environment variables
  const env = loadEnv(path.resolve(PROJECT_ROOT, '.env'));

  const supabaseUrl = env.SUPABASE_URL || 'https://xiniaecawuieywlnopry.supabase.co';
  const projectRef = supabaseUrl.split('//')[1]?.split('.')[0] || 'xiniaecawuieywlnopry';
  
  const secretKey = env.SUPABASE_SECRET_KEY || 'sb_secret_Cxx4d_CSXL3mFq6dUUyXLg_BjJsRSLX';
  const dbPassword = secretKey.startsWith('sb_secret_') ? secretKey.replace('sb_secret_', '') : secretKey;

  const host = process.env.DB_HOST || `db.${projectRef}.supabase.co`;
  const user = process.env.DB_USER || 'postgres';
  const database = process.env.DB_NAME || 'postgres';
  
  const migrationFiles = [
    'supabase/migrations/20260714193500_proctoring_atomic_rpcs.sql',
    'supabase/migrations/20260714193600_add_applications_status_check.sql',
    'supabase/migrations/20260714193700_secure_ai_usage_logs_rls.sql'
  ];

  console.log('To run this Node.js script, you must first install the PostgreSQL driver "pg" in the root directory:');
  console.log('  npm install pg\n');

  let pg;
  try {
    pg = require('pg');
  } catch (err) {
    console.error('Error: "pg" module not found. Please install it first with: npm install pg');
    process.exit(1);
  }

  // Define ports to try (6543 for pooling/transaction, 5432 for direct connection)
  const ports = [6543, 5432];
  let client = null;
  let connected = false;

  for (const port of ports) {
    try {
      console.log(`Attempting connection to ${host}:${port}...`);
      client = new pg.Client({
        host,
        port,
        user,
        password: dbPassword,
        database,
        ssl: { rejectUnauthorized: false } // Required for Supabase ssl connections
      });
      await client.connect();
      connected = true;
      console.log(`Successfully connected to database on port ${port}!`);
      break;
    } catch (err) {
      console.log(`Failed to connect on port ${port}: ${err.message}`);
      if (client) {
        try { await client.end(); } catch (e) {}
      }
    }
  }

  if (!connected || !client) {
    console.error('Error: Could not connect to the remote database on any port.');
    process.exit(1);
  }

  try {
    // Start transaction block
    console.log('Beginning migration transaction...');
    await client.query('BEGIN');

    for (const fileRelPath of migrationFiles) {
      const filePath = path.resolve(PROJECT_ROOT, fileRelPath);
      if (!fs.existsSync(filePath)) {
        throw new Error(`Migration file not found at: ${filePath}`);
      }

      console.log(`Reading migration: ${fileRelPath}...`);
      const sqlContent = fs.readFileSync(filePath, 'utf8');

      console.log(`Applying SQL from: ${fileRelPath}...`);
      await client.query(sqlContent);
      console.log(`✓ Migration ${fileRelPath} applied successfully.`);
    }

    // Commit transaction
    await client.query('COMMIT');
    console.log('★ All migrations applied and committed successfully!');
  } catch (err) {
    console.error(`✕ Migration transaction failed and was rolled back: ${err.message}`);
    try {
      await client.query('ROLLBACK');
    } catch (rollbackErr) {
      console.error(`Error during rollback: ${rollbackErr.message}`);
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

run().catch((err) => {
  console.error('Fatal error running migrations:', err);
  process.exit(1);
});
