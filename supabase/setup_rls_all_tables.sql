-- ==========================================
-- RLS Policies for ALL Remaining Tables
-- Safe to re-run (drops existing policies first)
-- ==========================================

-- Enable RLS on remaining tables
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_usage_log ENABLE ROW LEVEL SECURITY;


-- ==========================================
-- ATTENDANCE
-- ==========================================
DROP POLICY IF EXISTS "Admins can do everything on attendance" ON attendance;
DROP POLICY IF EXISTS "Engineers can view own attendance" ON attendance;
DROP POLICY IF EXISTS "Engineers can insert own attendance" ON attendance;
DROP POLICY IF EXISTS "Engineers can update own attendance" ON attendance;

CREATE POLICY "Admins can do everything on attendance"
ON attendance FOR ALL USING (is_admin());

CREATE POLICY "Engineers can view own attendance"
ON attendance FOR SELECT USING (engineer_id = auth.uid());

CREATE POLICY "Engineers can insert own attendance"
ON attendance FOR INSERT WITH CHECK (engineer_id = auth.uid());

CREATE POLICY "Engineers can update own attendance"
ON attendance FOR UPDATE USING (engineer_id = auth.uid());


-- ==========================================
-- MILESTONES
-- ==========================================
DROP POLICY IF EXISTS "Admins can do everything on milestones" ON milestones;
DROP POLICY IF EXISTS "All authenticated users can view milestones" ON milestones;

CREATE POLICY "Admins can do everything on milestones"
ON milestones FOR ALL USING (is_admin());

CREATE POLICY "All authenticated users can view milestones"
ON milestones FOR SELECT USING (auth.uid() IS NOT NULL);


-- ==========================================
-- TASKS
-- ==========================================
DROP POLICY IF EXISTS "Admins can do everything on tasks" ON tasks;
DROP POLICY IF EXISTS "Engineers can view all tasks" ON tasks;
DROP POLICY IF EXISTS "Engineers can update own tasks" ON tasks;

CREATE POLICY "Admins can do everything on tasks"
ON tasks FOR ALL USING (is_admin());

CREATE POLICY "Engineers can view all tasks"
ON tasks FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Engineers can update own tasks"
ON tasks FOR UPDATE USING (engineer_id = auth.uid());


-- ==========================================
-- LEAVE REQUESTS
-- ==========================================
DROP POLICY IF EXISTS "Admins can do everything on leave_requests" ON leave_requests;
DROP POLICY IF EXISTS "Engineers can view own leave requests" ON leave_requests;
DROP POLICY IF EXISTS "Engineers can insert own leave requests" ON leave_requests;

CREATE POLICY "Admins can do everything on leave_requests"
ON leave_requests FOR ALL USING (is_admin());

CREATE POLICY "Engineers can view own leave requests"
ON leave_requests FOR SELECT USING (engineer_id = auth.uid());

CREATE POLICY "Engineers can insert own leave requests"
ON leave_requests FOR INSERT WITH CHECK (engineer_id = auth.uid());


-- ==========================================
-- NOTIFICATIONS
-- ==========================================
DROP POLICY IF EXISTS "Admins can do everything on notifications" ON notifications;
DROP POLICY IF EXISTS "Engineers can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Engineers can update own notifications" ON notifications;

CREATE POLICY "Admins can do everything on notifications"
ON notifications FOR ALL USING (is_admin());

CREATE POLICY "Engineers can view own notifications"
ON notifications FOR SELECT USING (engineer_id = auth.uid());

CREATE POLICY "Engineers can update own notifications"
ON notifications FOR UPDATE USING (engineer_id = auth.uid());


-- ==========================================
-- MEETINGS
-- ==========================================
DROP POLICY IF EXISTS "Admins can do everything on meetings" ON meetings;
DROP POLICY IF EXISTS "All authenticated users can view meetings" ON meetings;

CREATE POLICY "Admins can do everything on meetings"
ON meetings FOR ALL USING (is_admin());

CREATE POLICY "All authenticated users can view meetings"
ON meetings FOR SELECT USING (auth.uid() IS NOT NULL);


-- ==========================================
-- PROJECT FILES
-- ==========================================
DROP POLICY IF EXISTS "Admins can do everything on project_files" ON project_files;
DROP POLICY IF EXISTS "All authenticated users can view project files" ON project_files;
DROP POLICY IF EXISTS "Engineers can upload project files" ON project_files;

CREATE POLICY "Admins can do everything on project_files"
ON project_files FOR ALL USING (is_admin());

CREATE POLICY "All authenticated users can view project files"
ON project_files FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Engineers can upload project files"
ON project_files FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);


-- ==========================================
-- TIME ENTRIES
-- ==========================================
DROP POLICY IF EXISTS "Admins can do everything on time_entries" ON time_entries;
DROP POLICY IF EXISTS "Engineers can view own time entries" ON time_entries;
DROP POLICY IF EXISTS "Engineers can insert own time entries" ON time_entries;
DROP POLICY IF EXISTS "Engineers can update own time entries" ON time_entries;

CREATE POLICY "Admins can do everything on time_entries"
ON time_entries FOR ALL USING (is_admin());

CREATE POLICY "Engineers can view own time entries"
ON time_entries FOR SELECT USING (engineer_id = auth.uid());

CREATE POLICY "Engineers can insert own time entries"
ON time_entries FOR INSERT WITH CHECK (engineer_id = auth.uid());

CREATE POLICY "Engineers can update own time entries"
ON time_entries FOR UPDATE USING (engineer_id = auth.uid());


-- ==========================================
-- APP USAGE LOG
-- ==========================================
DROP POLICY IF EXISTS "Admins can do everything on app_usage_log" ON app_usage_log;
DROP POLICY IF EXISTS "Engineers can view own app usage logs" ON app_usage_log;
DROP POLICY IF EXISTS "Engineers can insert own app usage logs" ON app_usage_log;

CREATE POLICY "Admins can do everything on app_usage_log"
ON app_usage_log FOR ALL USING (is_admin());

CREATE POLICY "Engineers can view own app usage logs"
ON app_usage_log FOR SELECT USING (engineer_id = auth.uid());

CREATE POLICY "Engineers can insert own app usage logs"
ON app_usage_log FOR INSERT WITH CHECK (engineer_id = auth.uid());
