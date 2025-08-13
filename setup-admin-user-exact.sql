-- SETUP ADMIN USER - EXACT SCRIPT
-- Run this after the functions are fixed

-- STEP 1: Find your user ID (replace with your actual user ID)
-- First, run this to see your users:
SELECT 'YOUR USERS:' as info;
SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC LIMIT 5;

-- STEP 2: Make yourself admin (replace YOUR_USER_ID_HERE with your actual UUID)
-- Example: INSERT INTO user_roles (user_id, role) VALUES ('12345678-1234-1234-1234-123456789abc', 'admin');
INSERT INTO user_roles (user_id, role) 
VALUES ('YOUR_USER_ID_HERE', 'admin')  -- Replace with your actual user ID
ON CONFLICT (user_id, role) DO NOTHING;

-- STEP 3: Verify admin users
SELECT 'ADMIN USERS:' as info;
SELECT 
  u.id,
  u.email,
  ur.role,
  ur.is_active,
  ur.created_at as role_created_at
FROM auth.users u
JOIN user_roles ur ON u.id = ur.user_id
WHERE ur.role IN ('admin', 'super_admin')
ORDER BY ur.created_at DESC;

-- STEP 4: Test the is_admin function
SELECT 'TESTING IS_ADMIN FUNCTION:' as info;
SELECT is_admin() as current_user_is_admin;

-- STEP 5: Test the functions work
SELECT 'READY TO TEST ADMIN DASHBOARD' as status;
