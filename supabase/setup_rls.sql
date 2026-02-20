-- 1. Ensure `role` column exists in `engineers` and has a default value (e.g., 'engineer' or 'admin')
-- Note: It looks like 'engineers' already contains 'role'.
-- If you need to make someone an admin, you would run: UPDATE engineers SET role = 'admin' WHERE id = 'their-uuid';

-- 2. Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE engineers ENABLE ROW LEVEL SECURITY;
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;

-- 3. Define a helper function to check if the current user is an admin
-- It checks the engineers table to see if their UUID has role = 'admin'
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  current_role TEXT;
BEGIN
  SELECT role INTO current_role 
  FROM engineers 
  WHERE id = auth.uid();
  
  RETURN current_role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ==========================================
-- POLICIES FOR PROJECTS
-- ==========================================
-- Admin: can read/write everything
CREATE POLICY "Admins can do everything on projects"
ON projects
FOR ALL
USING (is_admin());

-- Engineer: can read all projects (assuming engineers need to select projects)
CREATE POLICY "Engineers can view projects"
ON projects
FOR SELECT
USING (true);


-- ==========================================
-- POLICIES FOR ENGINEERS
-- ==========================================
-- Admin: can read/write everything
CREATE POLICY "Admins can do everything on engineers"
ON engineers
FOR ALL
USING (is_admin());

-- Engineer: can read/update their OWN profile ONLY
CREATE POLICY "Engineers can view and update own profile"
ON engineers
FOR SELECT
USING (id = auth.uid());


-- ==========================================
-- POLICIES FOR ENTRIES
-- ==========================================
-- Admin: can read/write everything
CREATE POLICY "Admins can do everything on entries"
ON entries
FOR ALL
USING (is_admin());

-- Engineer: can view, insert, update their OWN entries ONLY
CREATE POLICY "Engineers can view their own entries"
ON entries
FOR SELECT
USING (engineer_id = auth.uid());

CREATE POLICY "Engineers can insert their own entries"
ON entries
FOR INSERT
WITH CHECK (engineer_id = auth.uid());

CREATE POLICY "Engineers can update their own entries"
ON entries
FOR UPDATE
USING (engineer_id = auth.uid());

CREATE POLICY "Engineers can delete their own entries"
ON entries
FOR DELETE
USING (engineer_id = auth.uid());


-- ==========================================
-- TRIGGER: Auto-create engineer profile on signup (Optional)
-- ==========================================
-- Allows users who sign up via Supabase Auth to automatically get an entry in `engineers`.
-- If the app is strictly invite-only, you can remove this and insert users manually.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.engineers (id, name, role)
  VALUES (new.id, split_part(new.email, '@', 1), 'engineer');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
