-- app_settings: key-value store for global application settings
-- Run this in the Supabase SQL Editor

CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default target hours
INSERT INTO app_settings (key, value) VALUES ('target_hours', '100')
ON CONFLICT (key) DO NOTHING;

-- Enable RLS 
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Admins only: full access to settings
CREATE POLICY "Admin full access on app_settings" ON app_settings
    FOR ALL USING (
        EXISTS (SELECT 1 FROM engineers WHERE id = auth.uid() AND role = 'admin')
    );

-- Engineers: read-only
CREATE POLICY "Engineers read app_settings" ON app_settings
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM engineers WHERE id = auth.uid())
    );
