#!/usr/bin/env node
/**
 * Prints instructions to fix organization_members RLS infinite recursion.
 * Run after applying the migration in Supabase SQL Editor.
 *
 *   node scripts/apply-rls-fix.mjs
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const migrationPath = join(
  root,
  'supabase/migrations/20260706190000_fix_org_members_rls_recursion.sql',
)

const sql = readFileSync(migrationPath, 'utf8')

console.log(`Fix: infinite recursion on organization_members RLS

1. Open Supabase Dashboard → SQL Editor
2. Paste and run the migration below (or the file at):
   ${migrationPath}

3. Verify:
   node apps/web/scripts/verify-org-members-rls.mjs

--- SQL ---

${sql}
`)
