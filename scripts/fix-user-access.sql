-- Fix user access for testing
-- This script will update the user's subscription and activation status

-- First, let's check the current user status
SELECT 
  id,
  email,
  is_active,
  subscription_end_date,
  created_at
FROM users 
WHERE id = 'b0d2ff54-52d4-451a-9c71-f98b6457ddf0';

-- Update user to be active and have a valid subscription
UPDATE users 
SET 
  is_active = true,
  subscription_end_date = NOW() + INTERVAL '1 year'
WHERE id = 'b0d2ff54-52d4-451a-9c71-f98b6457ddf0';

-- Also check if the exercise is public
SELECT 
  id,
  name,
  is_public,
  chapter_id
FROM exercises 
WHERE id = '79d2862a-2e4e-45de-9675-737fd9ac921d';

-- Make the exercise public for testing (optional)
UPDATE exercises 
SET is_public = true
WHERE id = '79d2862a-2e4e-45de-9675-737fd9ac921d';

-- Verify the changes
SELECT 
  id,
  email,
  is_active,
  subscription_end_date
FROM users 
WHERE id = 'b0d2ff54-52d4-451a-9c71-f98b6457ddf0';

SELECT 
  id,
  name,
  is_public
FROM exercises 
WHERE id = '79d2862a-2e4e-45de-9675-737fd9ac921d';
