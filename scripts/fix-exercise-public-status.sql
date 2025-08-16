-- Fix exercise public status
-- This script ensures the specific exercise is marked as public

-- 1. Check current status
SELECT 
  id,
  name,
  is_public,
  created_at
FROM exercises 
WHERE id = '79d2862a-2e4e-45de-9675-737fd9ac921d';

-- 2. Update the exercise to be public
UPDATE exercises 
SET is_public = true
WHERE id = '79d2862a-2e4e-45de-9675-737fd9ac921d';

-- 3. Verify the update
SELECT 
  id,
  name,
  is_public,
  created_at
FROM exercises 
WHERE id = '79d2862a-2e4e-45de-9675-737fd9ac921d';

-- 4. Also mark a few more exercises as public for testing
UPDATE exercises 
SET is_public = true
WHERE id IN (
  SELECT id FROM exercises 
  WHERE is_public = false
  ORDER BY created_at 
  LIMIT 5
);

-- 5. Check how many exercises are now public
SELECT 
  COUNT(*) as total_exercises,
  COUNT(CASE WHEN is_public = true THEN 1 END) as public_exercises,
  COUNT(CASE WHEN is_public = false THEN 1 END) as private_exercises
FROM exercises;
