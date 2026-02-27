-- audit_log: tracks all CRUD operations for accountability
-- Run this in the Supabase SQL Editor

CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'deleted')),
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    changes JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_table ON audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at DESC);

-- Enable RLS
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Admins: full access
DROP POLICY IF EXISTS "Admin full access on audit_log" ON audit_log;
CREATE POLICY "Admin full access on audit_log" ON audit_log
    FOR ALL USING (
        EXISTS (SELECT 1 FROM engineers WHERE id = auth.uid() AND role = 'admin')
    );

-- Engineers: can read own audit entries and insert their own
DROP POLICY IF EXISTS "Engineers read own audit" ON audit_log;
CREATE POLICY "Engineers read own audit" ON audit_log
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Engineers insert own audit" ON audit_log;
CREATE POLICY "Engineers insert own audit" ON audit_log
    FOR INSERT WITH CHECK (user_id = auth.uid());
