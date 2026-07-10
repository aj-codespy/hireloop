#!/usr/bin/env node
/**
 * Verifies organization_members is readable after the RLS recursion fix.
 */

import { createRequire } from 'node:module'
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const { createClient } = require(resolve(webRoot, 'node_modules/@supabase/supabase-js'))

function loadEnvFile(path) {
  if (!existsSync(path)) return
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq)
    const value = trimmed.slice(eq + 1).replace(/^["']|["']$/g, '')
    if (!process.env[key]) process.env[key] = value
  }
}

loadEnvFile(resolve(webRoot, '.env.local'))

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!url || !key) {
  console.error('Missing Supabase env in apps/web/.env.local')
  process.exit(1)
}

const client = createClient(url, key)
const { data: signIn, error: signErr } = await client.auth.signInWithPassword({
  email: 'admin@hireloop.test',
  password: 'TestPass123!',
})

if (signErr) {
  console.error('Sign-in failed:', signErr.message)
  process.exit(1)
}

const { data, error } = await client
  .from('organization_members')
  .select('org_id, role')
  .eq('user_id', signIn.user.id)

if (error) {
  console.error('organization_members query failed:', error.message)
  console.error(
    '\nApply supabase/migrations/20260706190000_fix_org_members_rls_recursion.sql in Supabase SQL Editor.',
  )
  process.exit(1)
}

console.log('OK — organization_members readable:', data)
