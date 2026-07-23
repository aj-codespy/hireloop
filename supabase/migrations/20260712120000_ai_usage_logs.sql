CREATE TABLE ai_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT REFERENCES interview_sessions(id) ON DELETE CASCADE,
    feature TEXT NOT NULL, -- e.g., 'scoring', 'tts', 'stt', 'proctoring'
    model TEXT NOT NULL,
    prompt_tokens INTEGER NOT NULL DEFAULT 0,
    completion_tokens INTEGER NOT NULL DEFAULT 0,
    total_cost NUMERIC(10, 6) NOT NULL DEFAULT 0,
    latency_ms INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS: Only admins can read
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view AI usage logs" 
    ON ai_usage_logs 
    FOR SELECT 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.account_type = 'org_admin'
        )
    );

-- Create index for performance
CREATE INDEX idx_ai_usage_logs_session_id ON ai_usage_logs(session_id);
