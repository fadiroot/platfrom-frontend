-- Migration: Fix student_profile RLS policy
-- This migration adds the missing RLS policy that allows users to insert their own student profile

BEGIN;

-- Add the missing RLS policy that allows users to insert their own profile
-- This policy was missing and causing 42501 errors when users try to create their profile
CREATE POLICY IF NOT EXISTS "Users can insert own student profile" ON student_profile
  FOR INSERT WITH CHECK (auth.uid() = user_id);

COMMIT;
