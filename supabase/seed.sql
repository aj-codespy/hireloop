-- Demo seed for local testing (run after all migrations).
-- Auth users: run `node scripts/seed-test-users.mjs` after this SQL.

insert into public.organizations (id, name, primary_color, intro_video_url, website, about, created_at)
values (
  'org-1',
  'Summit Finance Partners',
  '#FF6B00',
  'https://www.youtube.com/embed/VCPGMjCW0is',
  'https://summitfinance.example.com',
  'Summit Finance Partners is a mid-market audit and advisory firm hiring graduate talent across India.',
  '2026-06-01T10:00:00Z'
)
on conflict (id) do update set
  name = excluded.name,
  website = excluded.website,
  about = excluded.about;

insert into public.job_roles (
  id, org_id, title, description, status, eligibility_rules, passing_score,
  interview_question_count, form_fields, created_at, updated_at
) values
(
  'job-1', 'org-1',
  'Graduate Accountant — Audit Track',
  'Entry-level role for CA-intermediate candidates joining our audit practice. Strong reconciliation skills and client communication expected.',
  'live',
  '[{"fieldKey":"ca_attempt","label":"CA attempts","operator":"<=","value":2},{"fieldKey":"grad_score","label":"Graduation %","operator":">=","value":60}]'::jsonb,
  7.0,
  8,
  '[{"id":"f1","fieldKey":"name","label":"Full name","type":"text","required":true,"order":1},{"id":"f2","fieldKey":"email","label":"Email","type":"email","required":true,"order":2},{"id":"f3","fieldKey":"phone","label":"Phone","type":"phone","required":true,"order":3},{"id":"f4","fieldKey":"ca_attempt","label":"CA attempts so far","type":"number","required":true,"order":4},{"id":"f5","fieldKey":"grad_score","label":"Graduation score (%)","type":"number","required":true,"order":5},{"id":"f6","fieldKey":"resume","label":"Resume","type":"doc","required":true,"order":6}]'::jsonb,
  '2026-06-01T10:00:00Z', '2026-06-01T10:00:00Z'
),
(
  'job-2', 'org-1',
  'Financial Analyst — FP&A',
  'Support monthly forecasting, variance analysis, and board reporting for portfolio companies.',
  'draft',
  '[{"fieldKey":"grad_score","label":"Graduation %","operator":">=","value":65}]'::jsonb,
  7.5,
  null,
  '[{"id":"g1","fieldKey":"name","label":"Full name","type":"text","required":true,"order":1},{"id":"g2","fieldKey":"email","label":"Email","type":"email","required":true,"order":2},{"id":"g3","fieldKey":"grad_score","label":"Graduation score (%)","type":"number","required":true,"order":3}]'::jsonb,
  '2026-06-15T10:00:00Z', '2026-06-15T10:00:00Z'
)
on conflict (id) do update set
  interview_question_count = excluded.interview_question_count,
  status = excluded.status,
  updated_at = excluded.updated_at;

-- 12-question pool: 3 mandatory + 9 variable; interviews ask 8 total
insert into public.questions (
  id, question_bank_id, job_role_id, section, prompt_text, ideal_answer_notes,
  time_limit_seconds, score_threshold, order_index, is_active, is_mandatory
) values
('q1', 'bank-tech', 'job-1', 'technical', 'Walk me through how you would reconcile a bank statement against a general ledger.', 'Matching, unmatched items, timing differences, escalation.', 90, null, 1, true, true),
('q2', 'bank-tech', 'job-1', 'technical', 'How do you assess materiality when you find a discrepancy during an audit?', 'Quantitative thresholds, qualitative factors, documentation.', 75, null, 2, true, false),
('q3', 'bank-tech', 'job-1', 'technical', 'Explain the difference between accrual and cash basis accounting with an example.', 'Revenue recognition, expense matching, timing.', 75, null, 3, true, false),
('q4', 'bank-tech', 'job-1', 'technical', 'How would you test internal controls around vendor payments?', 'Segregation of duties, authorization, three-way match.', 90, null, 4, true, false),
('q5', 'bank-sit', 'job-1', 'situational', 'Tell me about a time you met a tight deadline while maintaining accuracy.', 'STAR format, prioritization, quality controls.', 75, null, 5, true, true),
('q6', 'bank-sit', 'job-1', 'situational', 'Describe a situation where you had to push back on a senior colleague.', 'Respectful disagreement, evidence-based reasoning.', 75, null, 6, true, false),
('q7', 'bank-sit', 'job-1', 'situational', 'How do you handle conflicting priorities from two managers?', 'Communication, escalation, documentation.', 75, null, 7, true, false),
('q8', 'bank-sit', 'job-1', 'situational', 'Tell me about a mistake you caught before it reached the client.', 'Ownership, remediation, preventive controls.', 75, null, 8, true, false),
('q9', 'bank-hr', 'job-1', 'hr', 'Why this role, and what do you hope to learn in your first six months?', 'Genuine motivation, realistic learning goals.', 60, null, 9, true, true),
('q10', 'bank-hr', 'job-1', 'hr', 'Where do you see yourself in three years within audit or advisory?', 'Career intent, realism, growth mindset.', 60, null, 10, true, false),
('q11', 'bank-tech', 'job-1', 'technical', 'What is your approach to learning a new accounting standard quickly?', 'Primary sources, examples, asking experts.', 75, null, 11, true, false),
('q12', 'bank-hr', 'job-1', 'hr', 'What kind of team culture helps you do your best work?', 'Collaboration, feedback, psychological safety.', 60, null, 12, true, false)
on conflict (id) do update set
  is_mandatory = excluded.is_mandatory,
  is_active = excluded.is_active,
  prompt_text = excluded.prompt_text;

insert into public.candidates (id, org_id, name, email, phone, resume_url, source, created_at) values
('cand-1', 'org-1', 'Priya Sharma', 'priya.test@hireloop.local', '+91 98765 43210', null, 'campus', '2026-06-20T08:00:00Z'),
('cand-2', 'org-1', 'Arjun Mehta', 'arjun.test@hireloop.local', '+91 91234 56789', null, 'referral', '2026-06-21T09:00:00Z'),
('cand-3', 'org-1', 'Sneha Reddy', 'sneha.test@hireloop.local', '+91 99887 76655', null, 'website', '2026-06-22T10:00:00Z'),
('cand-4', 'org-1', 'Rahul Kapoor', 'rahul.test@hireloop.local', '+91 90000 11122', null, 'campus', '2026-06-23T11:00:00Z'),
('cand-5', 'org-1', 'Ananya Iyer', 'ananya.test@hireloop.local', '+91 91122 33445', null, 'linkedin', '2026-06-24T12:00:00Z'),
('cand-6', 'org-1', 'Vikram Singh', 'vikram.test@hireloop.local', '+91 92233 44556', null, 'referral', '2026-06-25T13:00:00Z'),
('cand-7', 'org-1', 'Meera Nair', 'meera.test@hireloop.local', '+91 93344 55667', null, 'campus', '2026-06-26T14:00:00Z')
on conflict (id) do update set
  name = excluded.name,
  email = excluded.email,
  phone = excluded.phone;

insert into public.applications (
  id, candidate_id, job_role_id, form_response, status, interview_token, token_expires_at, created_at
) values
('app-1', 'cand-1', 'job-1', '{"name":"Priya Sharma","email":"priya.test@hireloop.local","phone":"+91 98765 43210","ca_attempt":1,"grad_score":72}'::jsonb, 'shortlisted', null, null, '2026-06-20T08:30:00Z'),
('app-2', 'cand-2', 'job-1', '{"name":"Arjun Mehta","email":"arjun.test@hireloop.local","phone":"+91 91234 56789","ca_attempt":2,"grad_score":68}'::jsonb, 'interview_sent', 'demo-token-arjun', '2026-08-01T00:00:00Z', '2026-06-21T09:30:00Z'),
('app-3', 'cand-3', 'job-1', '{"name":"Sneha Reddy","email":"sneha.test@hireloop.local","phone":"+91 99887 76655","ca_attempt":1,"grad_score":81}'::jsonb, 'applied', null, null, '2026-06-22T10:30:00Z'),
('app-4', 'cand-4', 'job-1', '{"name":"Rahul Kapoor","email":"rahul.test@hireloop.local","phone":"+91 90000 11122","ca_attempt":1,"grad_score":74}'::jsonb, 'interview_sent', 'demo-token-rahul', '2026-08-01T00:00:00Z', '2026-06-23T11:30:00Z'),
('app-5', 'cand-5', 'job-1', '{"name":"Ananya Iyer","email":"ananya.test@hireloop.local","phone":"+91 91122 33445","ca_attempt":0,"grad_score":55}'::jsonb, 'auto_rejected', null, null, '2026-06-24T12:30:00Z'),
('app-6', 'cand-6', 'job-1', '{"name":"Vikram Singh","email":"vikram.test@hireloop.local","phone":"+91 92233 44556","ca_attempt":1,"grad_score":77}'::jsonb, 'passed_ai', null, null, '2026-06-25T13:30:00Z'),
('app-7', 'cand-7', 'job-1', '{"name":"Meera Nair","email":"meera.test@hireloop.local","phone":"+91 93344 55667","ca_attempt":1,"grad_score":70}'::jsonb, 'applied', null, null, '2026-06-26T14:30:00Z')
on conflict (id) do update set
  status = excluded.status,
  interview_token = excluded.interview_token,
  token_expires_at = excluded.token_expires_at,
  form_response = excluded.form_response;
