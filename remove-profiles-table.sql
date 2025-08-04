-- =============================================
-- Remove Profiles Table Migration
-- =============================================

-- Drop RLS policies for profiles table
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.profiles;

-- Drop the profiles table
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Update user_progress table to reference auth.users directly
-- (Remove the profile_id foreign key constraint if it exists)

-- Optional: You can store user level in auth.users metadata instead
-- This will be handled in the application code