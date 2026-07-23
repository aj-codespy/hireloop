# Handoff Report: Database Schema and Queries Audit (Milestone 1.2)

## 1. Observation

### 1.1 Proctoring Logs Update Logic
In `apps/api/interview/supabase_store.py` (lines 539-575 and 577-611), the functions `append_proctoring_event` and `flag_session_proctoring` are defined as follows:

```python
539:     async def append_proctoring_event(
540:         self,
541:         session_id: str,
542:         *,
543:         event_type: str,
544:         severity: str,
545:         detail: str,
546:         question_index: int | None = None,
547:         analysis: dict | None = None,
548:         snapshot_path: str | None = None,
549:     ) -> None:
550:         rows = await self._request(
551:             "GET",
552:             "interview_sessions",
553:             params={"id": f"eq.{session_id}", "select": "proctoring_log"},
554:         )
555:         log: list[dict] = (rows[0].get("proctoring_log") if rows else None) or []
556:         entry: dict[str, Any] = {
557:             "at": datetime.now(timezone.utc).isoformat(),
558:             "type": event_type,
559:             "severity": severity,
560:             "detail": detail,
561:         }
562:         if question_index is not None:
563:             entry["questionIndex"] = question_index
564:         if analysis:
565:             entry["analysis"] = analysis
566:         if snapshot_path:
567:             entry["snapshotPath"] = snapshot_path
568:         log.append(entry)
569:         await self._request(
570:             "PATCH",
571:             "interview_sessions",
572:             params={"id": f"eq.{session_id}"},
573:             json={"proctoring_log": log},
574:             prefer="return=minimal",
575:         )
```

```python
577:     async def flag_session_proctoring(
578:         self,
579:         session_id: str,
580:         *,
581:         summary: dict,
582:     ) -> None:
583:         rows = await self._request(
584:             "GET",
585:             "interview_sessions",
586:             params={"id": f"eq.{session_id}", "select": "proctoring_summary"},
587:         )
588:         existing_summary = {}
589:         if rows:
590:             existing_summary = rows[0].get("proctoring_summary") or {}
591:             
592:         reasons = existing_summary.get("reasons") or []
593:         new_reason = summary.get("reason")
594:         if new_reason and new_reason not in reasons:
595:             reasons.append(new_reason)
596:             
597:         updated_summary = {
598:             **existing_summary,
599:             "flagged": True,
600:             "reasons": reasons,
601:             "warnings": summary.get("warnings", 0),
602:             "critical": summary.get("critical", 0),
603:         }
604: 
605:         await self._request(
606:             "PATCH",
607:             "interview_sessions",
608:             params={"id": f"eq.{session_id}"},
609:             json={"proctoring_summary": updated_summary},
610:             prefer="return=minimal",
611:         )
```

### 1.2 Applications Table Definition
In `supabase/migrations/20260703120000_initial_schema.sql` (lines 65-74), the `applications` table is created as follows:

```sql
65: create table public.applications (
66:   id text primary key,
67:   candidate_id text not null references public.candidates (id) on delete cascade,
68:   job_role_id text not null references public.job_roles (id) on delete cascade,
69:   form_response jsonb not null default '{}'::jsonb,
70:   status text not null,
71:   interview_token text unique,
72:   token_expires_at timestamptz,
73:   created_at timestamptz not null default now()
74: );
```

Note that the adjacent `interview_sessions` table (line 85) specifies a status constraint: `status text not null check (status in ('in_progress', 'completed', 'abandoned', 'flagged'))`.

### 1.3 Allowed Application Statuses
In `apps/web/src/lib/types.ts` (lines 33-44), the possible statuses for applications are defined as:

```typescript
33: export type ApplicationStatus =
34:   | "applied"
35:   | "auto_rejected"
36:   | "shortlisted"
37:   | "interview_sent"
38:   | "interviewed"
39:   | "interview_expired"
40:   | "passed_ai"
41:   | "rejected_ai"
42:   | "partner_review"
43:   | "hired"
44:   | "rejected_final";
```

### 1.4 AI Usage Logs RLS Policy
In `supabase/migrations/20260712120000_ai_usage_logs.sql` (lines 16-26), the table's Row Level Security is configured with this select policy:

```sql
16: CREATE POLICY "Admins can view AI usage logs" 
17:     ON ai_usage_logs 
18:     FOR SELECT 
19:     TO authenticated 
20:     USING (
21:         EXISTS (
22:             SELECT 1 FROM profiles 
23:             WHERE profiles.id = auth.uid() 
24:             AND profiles.account_type = 'org_admin'
25:         )
26:     );
```

---

## 2. Logic Chain

1. **Race Conditions (Proctoring logs/summaries)**:
   - When a user takes an interview, the backend API receives multiple concurrent event signals (e.g., face matching, window blurring, voice detection) processed by asynchronous Celery/asyncio background workers.
   - When `append_proctoring_event` or `flag_session_proctoring` runs, they issue a PostgREST `GET` query to fetch the current log state, modify it in Python memory, and issue a PostgREST `PATCH` query to save it back.
   - Since these operations are non-atomic and lack transaction isolation, two workers executing simultaneously for the same `session_id` can fetch the identical starting log/summary. The worker that finishes last will commit its modified state and completely overwrite the other worker's changes, leading to silent loss of proctoring events and summary metrics.

2. **Missing CHECK constraints on `applications.status`**:
   - Unlike the `interview_sessions` table, the `applications` table does not enforce status values at the database level.
   - This allows any client (or developer script) to set `status` to arbitrary strings (e.g. `'garbage'`), leading to inconsistent application state and app errors.
   - The frontend and backend codebase assume a specific closed set of 11 application statuses. Enforcing this set in SQL ensures data integrity.

3. **Cross-Tenant Data Leak in `ai_usage_logs`**:
   - The RLS policy for `ai_usage_logs` permits *any* authenticated user with `profiles.account_type = 'org_admin'` to select *all* logs.
   - Because it only filters on user profile role and does not bind the `session_id` in `ai_usage_logs` back to the organization the admin actually manages, Org Admin A can view all cost and latency logs belonging to candidates of Org B. This is a severe multi-tenant isolation failure.

---

## 3. Caveats

- We assume the backend writes to `ai_usage_logs` using the service role bypass key (`SUPABASE_SECRET_KEY`). This matches our observation that `log_ai_usage` uses `SUPABASE_SECRET_KEY` and does not require an `INSERT` policy.
- Changing `applications.status` constraints requires verifying that existing records do not violate the constraint. If there are stray statuses in production, they must be updated or cleaned before applying the migration.

---

## 4. Conclusion & Step-by-Step Fix Strategy

### 4.1 Fix for Proctoring Race Condition
Define PostgreSQL functions (RPCs) to perform the mutations atomically on the database side and avoid python-side read-modify-write loops.

**Step 1**: Create a new database migration file `supabase/migrations/20260714193500_proctoring_atomic_rpcs.sql`:
```sql
-- Atomic appender for proctoring event logs
CREATE OR REPLACE FUNCTION public.append_proctoring_event_rpc(
  p_session_id text,
  p_new_event jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.interview_sessions
  SET proctoring_log = COALESCE(proctoring_log, '[]'::jsonb) || p_new_event
  WHERE id = p_session_id;
END;
$$;

-- Atomic updates for flagging proctoring summary with row-level locks
CREATE OR REPLACE FUNCTION public.flag_session_proctoring_rpc(
  p_session_id text,
  p_new_reason text,
  p_warnings_count int,
  p_critical_count int
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing jsonb;
  v_reasons jsonb;
  v_updated jsonb;
BEGIN
  -- Row-level locking to prevent race conditions during concurrent modifications
  SELECT proctoring_summary INTO v_existing
  FROM public.interview_sessions
  WHERE id = p_session_id
  FOR UPDATE;

  IF v_existing IS NULL THEN
    v_existing := '{}'::jsonb;
  END IF;

  v_reasons := COALESCE(v_existing->'reasons', '[]'::jsonb);

  IF p_new_reason IS NOT NULL AND NOT (v_reasons @> jsonb_build_array(p_new_reason)) THEN
    v_reasons := v_reasons || jsonb_build_array(p_new_reason);
  END IF;

  v_updated := v_existing || jsonb_build_object(
    'flagged', true,
    'reasons', v_reasons,
    'warnings', p_warnings_count,
    'critical', p_critical_count
  );

  UPDATE public.interview_sessions
  SET proctoring_summary = v_updated
  WHERE id = p_session_id;
END;
$$;
```

**Step 2**: Modify `apps/api/interview/supabase_store.py` functions to delegate to the database RPC functions:
```python
    async def append_proctoring_event(
        self,
        session_id: str,
        *,
        event_type: str,
        severity: str,
        detail: str,
        question_index: int | None = None,
        analysis: dict | None = None,
        snapshot_path: str | None = None,
    ) -> None:
        entry: dict[str, Any] = {
            "at": datetime.now(timezone.utc).isoformat(),
            "type": event_type,
            "severity": severity,
            "detail": detail,
        }
        if question_index is not None:
            entry["questionIndex"] = question_index
        if analysis:
            entry["analysis"] = analysis
        if snapshot_path:
            entry["snapshotPath"] = snapshot_path
            
        await self._request(
            "POST",
            "rpc/append_proctoring_event_rpc",
            json={
                "p_session_id": session_id,
                "p_new_event": entry
            },
            prefer="return=minimal",
        )

    async def flag_session_proctoring(
        self,
        session_id: str,
        *,
        summary: dict,
    ) -> None:
        await self._request(
            "POST",
            "rpc/flag_session_proctoring_rpc",
            json={
                "p_session_id": session_id,
                "p_new_reason": summary.get("reason"),
                "p_warnings_count": summary.get("warnings", 0),
                "p_critical_count": summary.get("critical", 0),
            },
            prefer="return=minimal",
        )
```

### 4.2 Fix for Applications Status Check Constraint
**Step 1**: Create a migration file `supabase/migrations/20260714193600_add_applications_status_check.sql`:
```sql
ALTER TABLE public.applications
  ADD CONSTRAINT applications_status_check
  CHECK (status IN (
    'applied',
    'auto_rejected',
    'shortlisted',
    'interview_sent',
    'interviewed',
    'interview_expired',
    'passed_ai',
    'rejected_ai',
    'partner_review',
    'hired',
    'rejected_final'
  ));
```

### 4.3 Fix for AI Usage Logs Cross-Tenant Data Leak
**Step 1**: Create a migration file `supabase/migrations/20260714193700_secure_ai_usage_logs_rls.sql`:
```sql
-- Drop the insecure policy
DROP POLICY IF EXISTS "Admins can view AI usage logs" ON ai_usage_logs;

-- Recreate policy scoped to organization members who are admins
CREATE POLICY "Admins can view AI usage logs" 
    ON ai_usage_logs 
    FOR SELECT 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 
            FROM public.profiles p
            JOIN public.interview_sessions s ON s.id = ai_usage_logs.session_id
            JOIN public.applications a ON a.id = s.application_id
            JOIN public.job_roles j ON j.id = a.job_role_id
            WHERE p.id = auth.uid() 
              AND p.account_type = 'org_admin'
              -- Ensure user belongs to the organization that owned the interview session
              AND public.is_org_member(j.org_id, ARRAY['owner', 'admin'])
        )
    );
```

---

## 5. Verification Method

### 5.1 Verifying Proctoring Race Conditions Fix
To verify that concurrent writes no longer overwrite each other:
1. Write a verification script executing 20 concurrent requests targeting `append_proctoring_event` for a test session.
2. In the old code, this test will fail, resulting in a log length of `< 20` (events overwritten).
3. With the RPC fix applied, the database updates will run atomically, and the log array length will be exactly `20`.

### 5.2 Verifying CHECK Constraint
Verify check constraint validation:
1. Attempt to insert a row or update an existing row in the `applications` table setting `status` to `'invalid_status'`.
2. Ensure the query raises a `check constraint "applications_status_check" violation` error.
3. Validate that setting `status` to `'applied'` or other valid strings succeeds.

### 5.3 Verifying AI Usage Logs RLS Policy
Verify tenant isolation:
1. Seed the DB with two orgs: Org A and Org B, and corresponding users.
2. Log in as an Org Admin for Org A and perform a PostgREST select to `/rest/v1/ai_usage_logs`.
3. Verify that only logs corresponding to sessions from Org A applications are returned, and all Org B records are hidden.
