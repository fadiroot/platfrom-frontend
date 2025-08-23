-- Migration: Add phone column to student_profile table (Optional)
-- This migration adds a phone column to the student_profile table
-- Note: Phone is also stored in user metadata, this is for redundancy

BEGIN;

-- Add phone column to student_profile table
ALTER TABLE student_profile 
ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- Add index for phone column for better performance
CREATE INDEX IF NOT EXISTS idx_student_profile_phone ON student_profile(phone);

-- Update RLS policies to include phone field
-- Users can update their own profile (including phone)
DROP POLICY IF EXISTS "Users can update own student profile" ON student_profile;
CREATE POLICY "Users can update own student profile" ON student_profile
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

COMMIT;
