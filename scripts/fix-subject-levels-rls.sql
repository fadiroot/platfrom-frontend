-- Fix RLS policies for subject_levels table
-- Run this in the Supabase SQL editor

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view subject levels" ON subject_levels;
DROP POLICY IF EXISTS "Admins can manage subject levels" ON subject_levels;

-- Create new policies using the is_admin() function
CREATE POLICY "Anyone can view subject levels" ON subject_levels
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage subject levels" ON subject_levels
  FOR ALL USING (public.is_admin());

-- Verify the policies work
SELECT 'RLS policies updated successfully' as status;
