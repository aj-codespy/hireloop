# HireLoop Organization Deployment & Onboarding Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Deploy HireLoop to a new organization's infrastructure, configure all services, run database migrations, and validate end-to-end functionality for production use.

**Architecture:** Multi-tenant SaaS with FastAPI backend, Next.js frontend, Supabase (PostgreSQL + Auth + Storage) as the data layer, Docker Compose for container orchestration. Organizations are isolated via Row Level Security (RLS) on org_id.

**Tech Stack:**
- Backend: FastAPI (Python 3.11), Supabase/PostgREST, Gemini AI, WebSocket relay
- Frontend: Next.js 16 (React 19), Tailwind CSS 4, Supabase SSR
- Database: Supabase (PostgreSQL) with 20+ migrations
- Auth: Supabase Auth (email/password, Google OAuth)
- Email: Brevo SMTP (transactional), Resend (admin emails)
- Infrastructure: Docker Compose, Prometheus monitoring
- Storage: Supabase Storage buckets for interview audio/snapshots

---

## Current State Assessment

### ✅ Already Complete
- **Backend API**: Full FastAPI implementation with v1 REST routes + WebSocket interview relay
- **Database Schema**: 20 migration files covering orgs, jobs, candidates, applications, interviews, proctoring, webhooks, pipeline stages, scorecards, schedules, API keys, exports, activity logs
- **Supabase Store**: Complete `SupabaseInterviewStore` with session management, question selection, transcript persistence, proctoring, scoring
- **Frontend**: Next.js app with Supabase SSR auth, component library (shadcn), interview workspace
- **Docker**: Production Dockerfiles for API and Web, docker-compose.prod.yml
- **Environment Templates**: `.env.example` files for both API and Web
- **Monitoring**: Prometheus config with health checks

### ⚠️ Needs Configuration Per Organization
- Supabase project provisioning & migration application
- Environment variables (secrets) for API and Web
- DNS/SSL configuration for custom domain
- Email provider setup (Brevo + Resend)
- AI model keys (Gemini API)
- Organization onboarding in database (org record, admin user, API keys)

### ❌ Not Yet Done
- Production deployment to organization infrastructure
- End-to-end integration testing in org environment
- Load testing / performance validation
- Documentation handoff to org team

---

## Step-by-Step Deployment Plan

### Phase 1: Infrastructure Provisioning (Tasks 1-5)

#### Task 1: Provision Supabase Project

**Objective:** Create a new Supabase project for the organization and configure base settings.

**Files:**
- Reference: `supabase/config.toml` (local config template)
- Create: Organization-specific Supabase project via dashboard or CLI

**Step 1: Create Supabase project**
```bash
# Option A: Via Supabase Dashboard (recommended for production)
# 1. Go to https://supabase.com/dashboard
# 2. Click "New Project"
# 3. Organization: Select or create org account
# 4. Project name: hireloop-{org-slug}
# 5. Database password: Generate strong password (save in vault)
# 6. Region: Choose closest to org users
# 7. Pricing plan: Pro or Team (for production)

# Option B: Via Supabase CLI (if org has CLI access)
supabase projects create hireloop-{org-slug} --org-id {org-id} --region {region} --db-password {password}
```

**Step 2: Configure Supabase project settings**
- Authentication → Providers → Enable Email, Google OAuth
- Authentication → URL Configuration → Site URL: `https://{org-domain}`
- Authentication → URL Configuration → Redirect URLs: `https://{org-domain}/auth/callback`
- Storage → Create buckets: `interview-audio`, `proctoring-snapshots`, `candidate-attachments`
- Database → Extensions → Enable `pgcrypto`, `uuid-ossp`, `pg_trgm`
- Settings → API → Copy Project URL, anon key, service_role key

**Verification:**
```bash
# Test connection
curl -H "apikey: {anon_key}" -H "Authorization: Bearer {anon_key}" \
  "https://{project-ref}.supabase.co/rest/v1/" | jq .
# Expected: 200 OK with PostgREST capabilities
```

**Commit:** N/A (infrastructure)

---

#### Task 2: Apply Database Migrations

**Objective:** Run all 20 migration files against the organization's Supabase database.

**Files:**
- Source: `supabase/migrations/*.sql` (20 files in chronological order)
- Tool: Supabase CLI or psql

**Step 1: Install Supabase CLI (if not present)**
```bash
# macOS
brew install supabase/tap/supabase

# Linux/Other
curl -fsSL https://supabase.com/install.sh | sh
```

**Step 2: Link local migrations to remote project**
```bash
cd /Users/aj_builds/Documents/Programs/HireLoop
supabase link --project-ref {project-ref} --password {db-password}
```

**Step 3: Push migrations**
```bash
# Option A: Push all at once (development/staging)
supabase db push

# Option B: Apply individually for production safety
supabase migration up --include-all
```

**Step 4: Verify migrations applied**
```bash
supabase migration list
# Expected: All 20 migrations show "applied"
```

**Step 5: Seed initial data (optional but recommended)**
```bash
# Apply seed.sql for test data
psql "postgresql://postgres:{password}@db.{project-ref}.supabase.co:5432/postgres" \
  -f supabase/seed.sql
```

**Verification:**
```bash
# Check key tables exist
psql "postgresql://postgres:{password}@db.{project-ref}.supabase.co:5432/postgres" \
  -c "\dt" | grep -E "organizations|job_roles|candidates|applications|interview_sessions|api_keys|pipeline_stages"
# Expected: All core tables listed
```

**Commit:** N/A (database state)

---

#### Task 3: Create Organization Record & Admin User

**Objective:** Insert the organization row, create admin user via Supabase Auth, link via org_members, generate initial API keys.

**Files:**
- Modify: Database (via SQL or API)
- Reference: `supabase/migrations/20260706170000_rls_org_scope.sql` (RLS policies)

**Step 1: Insert organization**
```sql
-- Run in Supabase SQL Editor or via psql
INSERT INTO organizations (id, name, slug, settings, created_at)
VALUES (
  gen_random_uuid(),
  '{Org Display Name}',
  '{org-slug}',
  '{"timezone": "UTC", "locale": "en", "interview_settings": {}}'::jsonb,
  now()
)
RETURNING id;
-- Save the returned org_id
```

**Step 2: Create admin user via Supabase Auth**
```bash
# Via Supabase Dashboard: Authentication → Users → Invite User
# Email: admin@{org-domain}
# Role: admin (custom claim) or use org_members table
# Or via API:
curl -X POST "https://{project-ref}.supabase.co/auth/v1/admin/users" \
  -H "apikey: {service_role_key}" \
  -H "Authorization: Bearer {service_role_key}" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@{org-domain}", "password": "{temp-password}", "email_confirm": true, "user_metadata": {"org_id": "{org_id}", "role": "admin"}}'
```

**Step 3: Link user to organization**
```sql
-- Get the user_id from auth.users
INSERT INTO org_members (org_id, user_id, role, joined_at)
VALUES ('{org_id}', '{user_id}', 'admin', now());
```

**Step 4: Generate initial API key for org**
```bash
# Use the API endpoint once deployed, or run SQL:
INSERT INTO api_keys (id, org_id, key_hash, name, scopes, created_by, expires_at)
VALUES (
  gen_random_uuid(),
  '{org_id}',
  crypt('{raw-api-key}', gen_salt('bf')),  -- hash the raw key
  'Initial Org API Key',
  '["jobs:write","applications:write","scorecards:write","webhooks:write"]'::jsonb,
  '{user_id}',
  now() + interval '1 year'
);
-- Save the raw API key for the org admin
```

**Verification:**
```bash
# Test API key works (after API deployed)
curl -H "X-API-Key: {raw-api-key}" "https://{api-domain}/v1/jobs"
# Expected: 200 with empty data array
```

**Commit:** N/A (database state)

---

#### Task 4: Configure Environment Variables for API

**Objective:** Create `apps/api/.env` with all production values for the organization.

**Files:**
- Create: `apps/api/.env` (from `apps/api/.env.example`)
- Reference: `apps/api/config.py` (all env vars used)

**Step 1: Copy template**
```bash
cp /Users/aj_builds/Documents/Programs/HireLoop/apps/api/.env.example \
   /Users/aj_builds/Documents/Programs/HireLoop/apps/api/.env
```

**Step 2: Fill in all values**
```bash
# Edit apps/api/.env with production values:

# --- Database ---
SUPABASE_URL=https://{project-ref}.supabase.co
SUPABASE_KEY={anon-key}                    # Public anon key
SUPABASE_SERVICE_KEY={service_role_key}    # Service role key (server-only)
SUPABASE_SECRET_KEY={service_role_key}     # Same as service role for JWT verification

# --- Email (Brevo) ---
BREVO_SMTP_HOST=smtp-relay.brevo.com
BREVO_SMTP_PORT=587
BREVO_SMTP_LOGIN={brevo-smtp-login}
BREVO_SMTP_KEY={brevo-smtp-key}
BREVO_FROM=noreply@{org-domain}
BREVO_FROM_NAME=HireLoop

# --- AI Models (Gemini) ---
GEMINI_API_KEY={gemini-api-key}
MODEL=gemini-2.0-flash-live-preview-001
SCORING_MODEL=gemini-2.5-flash-001
STT_MODEL=gemini-2.5-flash-001
TTS_MODEL=gemini-2.5-flash-preview-tts-001
TTS_VOICE_EN=Kore
TTS_VOICE_HI=Kore

# --- App ---
APP_URL=https://{org-domain}
PORT=8000
INTERVIEW_OVERALL_LIMIT_SECONDS=600
INTERVIEW_RECONNECT_HOURS=2

# --- Internal secret (for question TTS pre-render) ---
INTERVIEW_INTERNAL_SECRET={generate-32-char-random-string}

# --- Disable dev SQLite ---
DEV_SQLITE=false
```

**Step 3: Verify config loads**
```bash
cd /Users/aj_builds/Documents/Programs/HireLoop/apps/api
python3 -c "
from config import supabase_enabled, SUPABASE_URL, SUPABASE_SECRET_KEY, DEV_SQLITE
print(f'SUPABASE_URL: {SUPABASE_URL[:50]}...')
print(f'SUPABASE_SECRET_KEY: {\"SET\" if SUPABASE_SECRET_KEY else \"MISSING\"}')
print(f'DEV_SQLITE: {DEV_SQLITE}')
print(f'supabase_enabled(): {supabase_enabled()}')
"
# Expected: supabase_enabled() = True, DEV_SQLITE = False
```

**Verification:**
```bash
# Test store initialization
python3 -c "
import asyncio
from interview.supabase_store import get_store
async def test():
    store = get_store()
    print('Store type:', type(store).__name__)
    # Test a simple query
    result = await store._request('GET', 'organizations', params={'limit': '1'})
    print('Orgs query:', 'OK' if result is not None else 'FAIL')
asyncio.run(test())
"
# Expected: Store type = SupabaseInterviewStore, Orgs query = OK
```

**Commit:**
```bash
git add apps/api/.env
git commit -m "chore: add production env for {org-slug}"
```

---

#### Task 5: Configure Environment Variables for Web

**Objective:** Create `apps/web/.env.local` with all production values for the organization.

**Files:**
- Create: `apps/web/.env.local` (from `apps/web/.env.example`)
- Reference: `apps/web/src/lib/supabase/*` (client/server Supabase config)

**Step 1: Copy template**
```bash
cp /Users/aj_builds/Documents/Programs/HireLoop/apps/web/.env.example \
   /Users/aj_builds/Documents/Programs/HireLoop/apps/web/.env.local
```

**Step 2: Fill in all values**
```bash
# Edit apps/web/.env.local with production values:

# --- Public API ---
NEXT_PUBLIC_API_URL=https://{api-domain}
NEXT_PUBLIC_APP_URL=https://{org-domain}

# --- Email (Resend for admin emails) ---
RESEND_API_KEY={resend-api-key}
RESEND_FROM=noreply@{org-domain}

# --- Supabase (Client-side) ---
NEXT_PUBLIC_SUPABASE_URL=https://{project-ref}.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY={anon-key}  # Same as SUPABASE_KEY

# --- Server-only Supabase (for admin actions) ---
SUPABASE_SECRET_KEY={service_role_key}

# --- Internal secret (must match API) ---
INTERVIEW_INTERNAL_SECRET={same-as-api-internal-secret}
```

**Step 3: Verify Next.js config**
```bash
cd /Users/aj_builds/Documents/Programs/HireLoop/apps/web
# Check next.config.ts has output: 'standalone' for Docker
cat next.config.ts
# If missing, add:
# const nextConfig = { output: 'standalone', ... }
```

**Verification:**
```bash
# Test build works with env
npm run build 2>&1 | tail -20
# Expected: "Compiled successfully" and "Generating static pages"
```

**Commit:**
```bash
git add apps/web/.env.local
git commit -m "chore: add production web env for {org-slug}"
```

---

### Phase 2: Container Build & Deploy (Tasks 6-9)

#### Task 6: Build Production Docker Images

**Objective:** Build optimized Docker images for API and Web with production configs.

**Files:**
- Modify: `apps/api/Dockerfile` (ensure DEV_SQLITE=0)
- Modify: `apps/web/Dockerfile` (ensure standalone output)
- Reference: `docker-compose.prod.yml`

**Step 1: Fix API Dockerfile for production**
```dockerfile
# apps/api/Dockerfile - Update ENV line 17-19:
ENV PYTHONPATH=/app/apps/api \
    DEV_SQLITE=0 \
    PYTHONUNBUFFERED=1
```

**Step 2: Ensure Web Dockerfile uses standalone output**
```bash
# Verify next.config.ts has:
# const nextConfig = { output: 'standalone', ... }
```

**Step 3: Build images locally first**
```bash
cd /Users/aj_builds/Documents/Programs/HireLoop

# Build API
docker build -t hireloop-api:{org-slug}-latest -f apps/api/Dockerfile .

# Build Web
docker build -t hireloop-web:{org-slug}-latest -f apps/web/Dockerfile .
```

**Step 4: Test images locally**
```bash
# Test API container
docker run --rm -d --name test-api \
  -p 8000:8000 \
  --env-file apps/api/.env \
  hireloop-api:{org-slug}-latest

sleep 10
curl http://localhost:8000/health
# Expected: {"status":"ok","service":"hireloop-interview-api","mode":"structured"}

docker stop test-api

# Test Web container
docker run --rm -d --name test-web \
  -p 3000:3000 \
  --env-file apps/web/.env.local \
  hireloop-web:{org-slug}-latest

sleep 15
curl http://localhost:3000
# Expected: HTML response with HireLoop landing page

docker stop test-web
```

**Verification:** Both containers start and serve health/landing page.

**Commit:**
```bash
git add apps/api/Dockerfile apps/web/next.config.ts
git commit -m "chore: production docker config for {org-slug}"
```

---

#### Task 7: Deploy to Organization Infrastructure

**Objective:** Deploy containers to organization's target environment (VM, Kubernetes, ECS, etc.)

**Files:**
- Reference: `docker-compose.prod.yml`
- Create: Organization-specific deployment manifests

**Step 1: Choose deployment target**
```
Option A: Single VM with Docker Compose (simplest)
Option B: Kubernetes (EKS/GKE/AKS) with Helm
Option C: AWS ECS / Google Cloud Run / Azure Container Apps
Option D: Vercel (Web) + Railway/Render/Fly.io (API)
```

**Step 2A: If Docker Compose on VM**
```bash
# On target VM:
# 1. Install Docker + Docker Compose
# 2. Clone repo or copy docker-compose.prod.yml + .env files
# 3. Create production env file:
cat > .env.prod <<EOF
DEV_SQLITE=0
SUPABASE_URL=https://{project-ref}.supabase.co
SUPABASE_KEY={anon-key}
SUPABASE_SERVICE_KEY={service-role-key}
SUPABASE_SECRET_KEY={service-role-key}
BREVO_SMTP_KEY={brevo-key}
BREVO_FROM=noreply@{org-domain}
GEMINI_API_KEY={gemini-key}
APP_URL=https://{org-domain}
INTERVIEW_INTERNAL_SECRET={internal-secret}
NEXT_PUBLIC_API_URL=https://{api-domain}
NEXT_PUBLIC_APP_URL=https://{org-domain}
NEXT_PUBLIC_SUPABASE_URL=https://{project-ref}.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY={anon-key}
RESEND_API_KEY={resend-key}
RESEND_FROM=noreply@{org-domain}
EOF

# 4. Deploy
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d

# 5. Verify
docker compose -f docker-compose.prod.yml ps
# Expected: api, web, prometheus all "Up (healthy)"
```

**Step 2B: If Kubernetes**
```bash
# Create namespace
kubectl create namespace hireloop-{org-slug}

# Create secrets
kubectl create secret generic hireloop-secrets \
  --from-literal=SUPABASE_URL=https://{project-ref}.supabase.co \
  --from-literal=SUPABASE_SERVICE_KEY={service-role-key} \
  --from-literal=BREVO_SMTP_KEY={brevo-key} \
  --from-literal=GEMINI_API_KEY={gemini-key} \
  --from-literal=INTERVIEW_INTERNAL_SECRET={internal-secret} \
  -n hireloop-{org-slug}

# Deploy using Helm chart or kustomize (create manifests)
# Apply: kubectl apply -k manifests/overlays/{org-slug}
```

**Step 3: Configure Reverse Proxy + TLS**
```nginx
# Example Nginx config for api.{org-domain}
server {
    listen 443 ssl http2;
    server_name api.{org-domain};
    ssl_certificate /etc/letsencrypt/live/api.{org-domain}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.{org-domain}/privkey.pem;
    
    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;  # For WebSocket
    }
}

# Example for app.{org-domain} (Next.js)
server {
    listen 443 ssl http2;
    server_name app.{org-domain};
    ssl_certificate /etc/letsencrypt/live/app.{org-domain}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.{org-domain}/privkey.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Step 4: Update Supabase Auth redirect URLs**
- Dashboard → Authentication → URL Configuration
- Site URL: `https://app.{org-domain}`
- Redirect URLs: `https://app.{org-domain}/auth/callback`, `https://app.{org-domain}/**`

**Verification:**
```bash
# Health checks
curl https://api.{org-domain}/health
curl https://app.{org-domain}
curl https://api.{org-domain}/v1/jobs -H "X-API-Key: {raw-api-key}"
# All expected: 200 OK
```

**Commit:** N/A (infrastructure deployment)

---

#### Task 8: Configure DNS & SSL

**Objective:** Point organization's domain to deployed services with valid TLS certificates.

**Files:** DNS provider records, Certbot/Let's Encrypt or managed certs

**Step 1: Create DNS records**
```
Type    Name          Value
A       api           {server-ip}
A       app           {server-ip}
CNAME   www           app.{org-domain}
TXT     _acme-challenge  {certbot-validation}  # For Let's Encrypt
```

**Step 2: Provision SSL certificates**
```bash
# Option A: Let's Encrypt with Certbot (VM)
sudo certbot --nginx -d api.{org-domain} -d app.{org-domain}

# Option B: Managed certificates (Cloudflare, AWS ACM, GCP SSL, etc.)
# Configure in cloud provider console
```

**Step 3: Verify HTTPS**
```bash
curl -I https://api.{org-domain}/health
curl -I https://app.{org-domain}
# Expected: 200 OK, valid certificate chain
```

**Verification:** Browser shows valid lock icon for both domains.

---

#### Task 9: Configure Email Providers

**Objective:** Set up Brevo (transactional) and Resend (admin) for the organization's domain.

**Files:** Email provider dashboards, DNS records for domain authentication

**Step 1: Configure Brevo (Transactional Emails)**
```
1. Create Brevo account or use org's account
2. Domain authentication: Add DKIM, SPF, DMARC records to DNS
   - DKIM: brevo._domainkey → {brevo-dkim-value}
   - SPF: @ → "v=spf1 include:spf.brevo.com ~all"
   - DMARC: _dmarc → "v=DMARC1; p=quarantine; rua=mailto:dmarc@{org-domain}"
3. Verify domain in Brevo dashboard
4. Create SMTP credentials: SMTP_LOGIN, SMTP_KEY
5. Test send via Brevo dashboard or API
```

**Step 2: Configure Resend (Admin Emails)**
```
1. Create Resend account
2. Add domain: {org-domain}
3. Add DNS records (DKIM, SPF, DMARC) as provided by Resend
4. Verify domain
5. Create API key
6. Test send via Resend dashboard
```

**Step 3: Test email flow end-to-end**
```bash
# Trigger test email via API (after deployment)
curl -X POST https://api.{org-domain}/v1/test-email \
  -H "X-API-Key: {raw-api-key}" \
  -H "Content-Type: application/json" \
  -d '{"to": "admin@{org-domain}", "type": "interview_invitation"}'
# Check inbox for test email
```

---

### Phase 3: Integration Testing (Tasks 10-15)

#### Task 10: API Health & Auth Verification

**Objective:** Verify all API endpoints respond correctly with organization's API key.

**Files:** `apps/api/routes/v1.py` (all endpoints)

**Step 1: Health check**
```bash
curl https://api.{org-domain}/health
# Expected: {"status":"ok","service":"hireloop-interview-api","mode":"structured"}
```

**Step 2: Auth validation**
```bash
# Valid key
curl https://api.{org-domain}/v1/jobs -H "X-API-Key: {raw-api-key}"
# Expected: 200 {"data":[],"next_cursor":null}

# Invalid key
curl https://api.{org-domain}/v1/jobs -H "X-API-Key: invalid"
# Expected: 401 {"detail":"Invalid API key"}

# Missing key
curl https://api.{org-domain}/v1/jobs
# Expected: 401 {"detail":"Missing X-API-Key header"}
```

**Step 3: Scope enforcement**
```bash
# Create a read-only key in DB, test write endpoint fails
curl -X POST https://api.{org-domain}/v1/jobs \
  -H "X-API-Key: {read-only-key}" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","description":"Test"}'
# Expected: 403 {"detail":"API key missing required scope 'jobs:write'..."}
```

**Verification:** All auth scenarios work correctly.

---

#### Task 11: Job & Application CRUD Flow

**Objective:** Test complete job creation → application → interview flow via API.

**Files:** `apps/api/routes/v1.py` (jobs, applications, transitions)

**Step 1: Create job role**
```bash
JOB_RESPONSE=$(curl -s -X POST https://api.{org-domain}/v1/jobs \
  -H "X-API-Key: {raw-api-key}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Senior Software Engineer",
    "description": "We are hiring a senior engineer...",
    "department_id": null,
    "status": "published",
    "passing_score": 70,
    "interview_question_count": 5,
    "form_fields": [{"key":"linkedin","label":"LinkedIn URL","type":"url","required":false}]
  }')
JOB_ID=$(echo $JOB_RESPONSE | jq -r .id)
echo "Created job: $JOB_ID"
# Expected: 201 with job object
```

**Step 2: Create candidate & application**
```bash
# Create candidate
CAND_RESPONSE=$(curl -s -X POST https://api.{org-domain}/v1/candidates \
  -H "X-API-Key: {raw-api-key}" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Candidate","email":"test+candidate@{org-domain}","org_id":"{org_id}"}')
CAND_ID=$(echo $CAND_RESPONSE | jq -r .id)

# Create application
APP_RESPONSE=$(curl -s -X POST https://api.{org-domain}/v1/applications \
  -H "X-API-Key: {raw-api-key}" \
  -H "Content-Type: application/json" \
  -d "{\"candidate_id\":\"$CAND_ID\",\"job_role_id\":\"$JOB_ID\",\"org_id\":\"{org_id}\"}")
APP_ID=$(echo $APP_RESPONSE | jq -r .id)
echo "Created application: $APP_ID"
```

**Step 3: Transition to interview_sent**
```bash
curl -s -X POST https://api.{org-domain}/v1/applications/$APP_ID/transition \
  -H "X-API-Key: {raw-api-key}" \
  -H "Content-Type: application/json" \
  -d '{"to_status":"interview_sent"}'
# Expected: 200 with new status
```

**Step 4: Get interview token (simulate candidate access)**
```bash
# Get application with token
APP_DETAIL=$(curl -s https://api.{org-domain}/v1/applications/$APP_ID \
  -H "X-API-Key: {raw-api-key}")
TOKEN=$(echo $APP_DETAIL | jq -r .token)
echo "Interview token: $TOKEN"
```

**Verification:** All CRUD operations succeed, token generated.

---

#### Task 12: Interview Session End-to-End

**Objective:** Test full interview WebSocket flow: connect → answer questions → complete → scoring.

**Files:** `apps/api/main.py` (WebSocket endpoint), `apps/api/interview/structured_relay.py`

**Step 1: Test session state endpoint (reconnect)**
```bash
curl -s -X POST "https://api.{org-domain}/interview/session/state?token=$TOKEN"
# Expected: 200 with session state or 404 if no active session
```

**Step 2: Connect to WebSocket (use test script)**
```bash
# Create test script
cat > /tmp/test_interview.py << 'EOF'
import asyncio
import websockets
import json

async def test_interview():
    uri = f"wss://api.{org-domain}/ws/interview?token={TOKEN}&lang=en"
    async with websockets.connect(uri, max_size=32*1024*1024) as ws:
        # Receive bootstrap
        msg = await ws.recv()
        print("Bootstrap:", msg)
        
        # Send ready
        await ws.send(json.dumps({"type": "ready"}))
        
        # Receive first question
        msg = await ws.recv()
        print("Question:", msg)
        
        # Simulate answer (send audio chunk)
        # In real test, send base64 audio
        await ws.send(json.dumps({"type": "answer_end"}))
        
        # Continue through questions...
        for _ in range(5):
            msg = await ws.recv()
            print("Received:", json.loads(msg).get("type"))
            if json.loads(msg).get("type") == "complete":
                break
            await ws.send(json.dumps({"type": "answer_end"}))

asyncio.run(test_interview())
EOF

# Run (requires websockets: pip install websockets)
python3 /tmp/test_interview.py
```

**Step 3: Verify session finalized**
```bash
# Check session status via API
curl -s https://api.{org-domain}/v1/applications/$APP_ID/score \
  -H "X-API-Key: {raw-api-key}"
# Expected: 200 with question_scores, overall_score
```

**Verification:** WebSocket connects, processes questions, completes, scoring works.

---

#### Task 13: Web Frontend Authentication Flow

**Objective:** Test complete auth flow on deployed web app: signup → login → dashboard.

**Files:** `apps/web/src/app/auth/*`, `apps/web/src/lib/supabase/*`

**Step 1: Access web app**
```bash
# Open in browser: https://app.{org-domain}
# Expected: Landing page loads
```

**Step 2: Test signup flow**
```
1. Click "Sign Up" / "Get Started"
2. Enter admin@{org-domain} email
3. Check email for magic link / confirmation
4. Click link → redirects to app
4. Complete profile setup
5. Land on dashboard
```

**Step 3: Test login flow**
```
1. Sign out
2. Click "Sign In"
3. Enter email
4. Magic link / password login
5. Redirect to dashboard
```

**Step 4: Verify org-scoped data**
```
1. Navigate to Jobs page
2. Should see only this org's jobs (created in Task 11)
3. Navigate to Applications
4. Should see test application
```

**Verification:** Auth works, data is org-scoped via RLS.

---

#### Task 14: Interview Candidate Experience (Web)

**Objective:** Test candidate-facing interview flow via web app.

**Files:** `apps/web/src/app/interview/*`, WebSocket client in frontend

**Step 1: Generate interview link**
```bash
# In admin dashboard: Applications → Test Application → "Send Interview Link"
# Or use token from Task 11
INTERVIEW_URL="https://app.{org-domain}/interview?token=$TOKEN"
```

**Step 2: Open as candidate**
```
1. Open INTERVIEW_URL in incognito/different browser
2. See candidate landing page with job details
3. Click "Start Interview"
4. Allow microphone permission
5. Complete interview flow (answer questions)
6. See completion screen
```

**Step 3: Verify recording & transcript**
```bash
# Check in admin dashboard
# Applications → Test Application → View Interview
# Should show: transcript, scores, proctoring summary, audio playback
```

**Verification:** Candidate can complete interview, results appear in admin.

---

#### Task 15: Webhook Delivery & Retry

**Objective:** Verify webhook events fire and are delivered to configured endpoints.

**Files:** `apps/api/interview/webhooks.py`, `apps/api/routes/v1.py` (webhook subscriptions)

**Step 1: Configure webhook endpoint (use requestbin or org's endpoint)**
```bash
# Create subscription
curl -s -X POST https://api.{org-domain}/v1/webhooks \
  -H "X-API-Key: {raw-api-key}" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://webhook.site/{unique-id}",
    "events": ["application.stage_changed", "interview.completed", "candidate.hired"],
    "description": "Test webhook"
  }'
WEBHOOK_ID=$(echo $RESPONSE | jq -r .id)
```

**Step 2: Trigger events**
```bash
# Transition application (triggers application.stage_changed)
curl -s -X POST https://api.{org-domain}/v1/applications/$APP_ID/transition \
  -H "X-API-Key: {raw-api-key}" \
  -H "Content-Type: application/json" \
  -d '{"to_status":"shortlisted"}'
```

**Step 3: Verify delivery**
```
1. Check webhook.site for received payload
2. Verify signature header matches (X-HireLoop-Signature)
3. Verify payload structure matches WebhookEventType
```

**Step 4: Test retry logic**
```
1. Point webhook to failing endpoint (returns 500)
2. Trigger event
3. Check webhook delivery logs (in DB: webhook_deliveries)
4. Verify retry attempts with exponential backoff
```

**Verification:** Webhooks deliver, sign, and retry correctly.

---

### Phase 4: Performance & Load Validation (Tasks 16-18)

#### Task 16: API Load Testing

**Objective:** Verify API handles expected concurrent interview sessions.

**Tools:** k6, loc