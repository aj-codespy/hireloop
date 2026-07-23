-- Add CHECK constraint to the applications table to restrict status column
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
