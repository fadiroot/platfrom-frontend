-- Clean up the old level_id column from subjects table
-- Run this in the Supabase SQL editor

-- First, make sure all data is migrated to subject_levels table
INSERT INTO subject_levels (subject_id, level_id)
SELECT id, level_id 
FROM subjects 
WHERE level_id IS NOT NULL
ON CONFLICT (subject_id, level_id) DO NOTHING;

-- Remove the old level_id column from subjects table
ALTER TABLE subjects DROP COLUMN IF EXISTS level_id;

-- Verify the cleanup
SELECT 'Old level_id column removed successfully' as status;
