# Fix Student Management Issue

## Problem
The student management feature is not working because:
1. The application is trying to access non-existent endpoints (`get_all_users_with_status`, `profiles` table)
2. The `getStudentProfiles` function was trying to use the admin API which may not be properly configured
3. RLS policies might be blocking access to student profile data

## Solution

### Step 1: Fix the Admin API
The `getStudentProfiles` function in `src/lib/api/admin.ts` has been updated to:
- Remove dependency on `supabaseAdmin.auth.admin.listUsers()`
- Work directly with the `student_profile` table
- Handle cases where user details are not available

### Step 2: Apply RLS Policy Fixes
Run the SQL script `fix-student-profile-rls.sql` to:
- Enable proper RLS policies for the `student_profile` table
- Ensure admins have full access to student profiles
- Allow authenticated users to read student profiles for the admin dashboard

### Step 3: Create Sample Data
Run the SQL script `create-sample-students.sql` to:
- Create sample student profiles for testing
- Include active, inactive, and expired students
- Provide data to test the student management interface

### Step 4: Test the Fix
1. Open the test page `test-student-management.html` in a browser
2. Click "Test Student Profiles" to verify database access
3. Click "Test Admin Check" to verify admin function works
4. Navigate to `/admin/students` in your application

## Files Modified

### 1. `src/lib/api/admin.ts`
- Fixed `getStudentProfiles` function to work without admin API
- Simplified data transformation
- Removed dependency on service role key for user listing

### 2. `src/modules/shared/components/Sidebar/items.tsx`
- Added "Étudiants" (Students) link to the sidebar navigation
- Added "Utilisateurs" (Users) link to the sidebar navigation
- Added appropriate icons for both menu items

### 3. `fix-student-profile-rls.sql`
- Comprehensive RLS policy fixes for student_profile table
- Ensures admin access works properly
- Maintains security while allowing necessary access

### 4. `create-sample-students.sql`
- Creates sample student profiles for testing
- Includes various account statuses (active, inactive, expired)
- Provides realistic test data

### 5. `test-student-management.html`
- Simple test page to verify database connectivity
- Tests student profile access
- Tests admin function availability

## Expected Results

After applying these fixes:

1. **Student Management Page**: Should load without errors at `/admin/students`
2. **Student List**: Should display student profiles from the database
3. **Activate/Deactivate**: Should work for managing student accounts
4. **Filters**: Should work for filtering by status, payment, and search
5. **Statistics**: Should show correct counts of active/inactive/expired students

## Troubleshooting

### If the page still doesn't load:
1. Check browser console for JavaScript errors
2. Verify that the `is_admin()` function exists and works
3. Ensure you're logged in as an admin user
4. Check that RLS policies are properly applied

### If no students appear:
1. Run the `create-sample-students.sql` script
2. Verify the `student_profile` table has data
3. Check that the `levels` table has data (required for relationships)

### If activate/deactivate doesn't work:
1. Verify the user has admin privileges
2. Check that the `student_profile` table has the required columns
3. Ensure RLS policies allow admin updates

## Database Requirements

The solution requires:
- `student_profile` table with proper structure
- `levels` table with at least one level
- `is_admin()` function working correctly
- Proper RLS policies applied

## Security Notes

- Admin access is verified using the `is_admin()` function
- RLS policies ensure only admins can manage student profiles
- User data is protected by proper access controls
- Service role key is not exposed to the client
