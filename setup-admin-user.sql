-- Setup Admin User Script
-- This script helps you set up an admin user for testing

-- Step 1: Insert admin role for a specific user
-- Replace 'YOUR_USER_ID_HERE' with the actual UUID of the user you want to make admin
-- You can get this from the Supabase dashboard or from auth.users table

-- Example: Make a user admin (replace with actual user ID)
-- INSERT INTO user_roles (user_id, role) 
-- VALUES ('YOUR_USER_ID_HERE', 'admin')
-- ON CONFLICT (user_id, role) DO NOTHING;

-- Step 2: Query to find your user ID (run this in Supabase SQL editor)
-- SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC LIMIT 10;

-- Step 3: Alternative: Make the most recent user admin (uncomment if needed)
-- INSERT INTO user_roles (user_id, role)
-- SELECT id, 'admin' FROM auth.users 
-- WHERE id = (SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1)
-- ON CONFLICT (user_id, role) DO NOTHING;

-- Step 4: Verify admin users
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

-- Step 5: Test the is_admin function
-- SELECT is_admin() as current_user_is_admin;
