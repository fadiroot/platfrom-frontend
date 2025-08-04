-- =============================================
-- Fix RLS Policies for Profiles Table
-- Run this in Supabase SQL Editor
-- =============================================

-- Drop existing policies that might be problematic
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Create more permissive policies for debugging
-- (You can make these more restrictive later)

-- Allow authenticated users to read their own profiles
CREATE POLICY "Enable read access for authenticated users on own profile" ON public.profiles
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND 
    (auth.uid() = id OR auth.role() = 'authenticated')
  );

-- Allow authenticated users to insert their own profile
CREATE POLICY "Enable insert for authenticated users on own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow authenticated users to update their own profile
CREATE POLICY "Enable update for authenticated users on own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Also create a more permissive temporary policy for debugging
-- (Remove this after debugging)
CREATE POLICY "Temporary debug policy for profiles" ON public.profiles
  FOR ALL USING (auth.role() = 'authenticated');

-- Check if the policies are working
SELECT * FROM public.profiles LIMIT 1;