# Supabase RPC Functions Fix Guide

## Problem Analysis

You're getting the error: `"operator does not exist: bigint = uuid"` when trying to activate/deactivate student accounts. This indicates a type mismatch between your database functions and the data being sent.

## Root Cause

The issue is that your database functions are expecting `bigint` parameters but your frontend is sending `uuid` values. This happens when:

1. Functions were created with wrong parameter types
2. Database schema uses UUIDs but functions expect integers
3. Parameter types don't match between frontend and backend

## Solution

### Step 1: Run the Complete Fix Script

Execute the `fix-rpc-functions-complete.sql` file in your Supabase SQL editor. This script:

- Drops all existing problematic functions
- Creates new functions with proper UUID parameter types
- Sets up proper permissions and RLS policies
- Creates the `user_roles` table for admin management

### Step 2: Set Up Admin User

1. Go to your Supabase dashboard
2. Open the SQL editor
3. Run this query to find your user ID:
   ```sql
   SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC LIMIT 10;
   ```
4. Copy your user ID and run:
   ```sql
   INSERT INTO user_roles (user_id, role) 
   VALUES ('YOUR_USER_ID_HERE', 'admin')
   ON CONFLICT (user_id, role) DO NOTHING;
   ```

### Step 3: Verify Functions

Run this query to verify your functions are created correctly:
```sql
SELECT 
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments,
  pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname IN ('activate_student_account', 'deactivate_student_account', 'is_admin')
ORDER BY p.proname;
```

### Step 4: Test Admin Status

Test if your user is recognized as admin:
```sql
SELECT is_admin() as current_user_is_admin;
```

## Function Signatures

After the fix, your functions will have these signatures:

### activate_student_account
```sql
activate_student_account(
  student_profile_id UUID,  -- user_id UUID
  admin_user_id UUID,
  subscription_months INTEGER DEFAULT 1,
  payment_amount NUMERIC DEFAULT NULL,
  payment_method TEXT DEFAULT NULL,
  payment_notes TEXT DEFAULT NULL
) RETURNS BOOLEAN
```

### deactivate_student_account
```sql
deactivate_student_account(
  student_profile_id UUID,  -- user_id UUID
  admin_user_id UUID,
  reason TEXT DEFAULT NULL
) RETURNS BOOLEAN
```

### is_admin
```sql
is_admin() RETURNS BOOLEAN
```

## Frontend Integration

Your frontend code in `src/lib/api/admin.ts` is already correctly sending UUIDs. The functions will now accept them properly.

## Troubleshooting

### If you still get errors:

1. **Check function existence:**
   ```sql
   SELECT proname FROM pg_proc WHERE proname LIKE '%student_account%';
   ```

2. **Verify parameter types:**
   ```sql
   SELECT 
     p.proname,
     pg_get_function_arguments(p.oid)
   FROM pg_proc p
   WHERE p.proname IN ('activate_student_account', 'deactivate_student_account');
   ```

3. **Check admin status:**
   ```sql
   SELECT * FROM user_roles WHERE role = 'admin';
   ```

4. **Test with direct SQL:**
   ```sql
   SELECT activate_student_account(
     'USER_ID_HERE'::UUID,
     'ADMIN_ID_HERE'::UUID,
     1,
     100.00,
     'credit_card',
     'Test activation'
   );
   ```

## Database Schema

Make sure your `student_profile` table has the correct structure:

```sql
CREATE TABLE student_profile (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  level_id UUID REFERENCES levels(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT false,
  subscription_start_date TIMESTAMP,
  subscription_end_date TIMESTAMP,
  payment_status VARCHAR(50) DEFAULT 'pending',
  payment_amount DECIMAL(10,2),
  payment_method VARCHAR(100),
  payment_notes TEXT,
  activated_by UUID REFERENCES auth.users(id),
  activated_at TIMESTAMP,
  deactivated_at TIMESTAMP,
  deactivated_by UUID REFERENCES auth.users(id),
  deactivation_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Security Notes

- All functions use `SECURITY DEFINER` to run with elevated privileges
- Admin checks are performed within each function
- RLS policies are in place for data protection
- Functions validate admin status before performing operations

## Next Steps

1. Run the fix script in Supabase SQL editor
2. Set up your admin user
3. Test the functions
4. Update your frontend if needed
5. Monitor for any remaining issues

The fix should resolve the `bigint = uuid` error and allow your admin dashboard to work properly.
