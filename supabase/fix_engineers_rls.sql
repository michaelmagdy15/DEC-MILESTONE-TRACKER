-- Fix engineers RLS: allow all authenticated users full access
DROP POLICY IF EXISTS "Authenticated users can view all engineers" ON engineers;
DROP POLICY IF EXISTS "Engineers can view and update own profile" ON engineers;
DROP POLICY IF EXISTS "Public access engineers" ON engineers;
DROP POLICY IF EXISTS "Admins can do everything on engineers" ON engineers;

CREATE POLICY "Enable full access for authenticated" ON engineers
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);
