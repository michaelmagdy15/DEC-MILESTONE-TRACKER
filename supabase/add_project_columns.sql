-- ==========================================
-- Add team_members, start_date, end_date to projects table
-- Run this in Supabase SQL Editor
-- ==========================================

-- Add team_members as a JSONB array of engineer IDs
ALTER TABLE projects ADD COLUMN IF NOT EXISTS team_members jsonb DEFAULT '[]'::jsonb;

-- Add start_date and end_date for project duration tracking
ALTER TABLE projects ADD COLUMN IF NOT EXISTS start_date date;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS end_date date;

-- DONE: These columns are now available for the enhanced project creation form.
