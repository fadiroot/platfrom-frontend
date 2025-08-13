# Admin System Guide

This guide explains how to set up and use the comprehensive admin system for the platform.

## Overview

The admin system provides secure access control and management capabilities for administrators. It includes:

- **Admin Authentication**: Secure admin role checking using database functions
- **RLS Policies**: Row Level Security policies that properly handle admin permissions
- **Admin Guards**: React components that protect admin routes
- **Admin API**: Comprehensive API for admin operations
- **Admin Dashboard**: Protected admin interface

## Database Functions

The system uses several database functions for admin operations:

### `is_admin()`
- **Purpose**: Checks if the current user has admin privileges
- **Returns**: `boolean`
- **Usage**: Used in RLS policies and admin checks

### `get_student_profiles()`
- **Purpose**: Returns all student profiles (admin only)
- **Returns**: Table with student information
- **Usage**: Admin dashboard to view all students

### `get_user_accessible_exercises(user_uuid)`
- **Purpose**: Returns exercises accessible to a specific user
- **Returns**: Table with exercise information
- **Usage**: Admin can see all exercises, users see filtered results

### `can_access_exercise(exercise_id)`
- **Purpose**: Checks if current user can access a specific exercise
- **Returns**: `boolean`
- **Usage**: Exercise access control

### `update_student_status(p_user_id, p_is_active, p_deactivation_reason)`
- **Purpose**: Updates student account status (admin only)
- **Returns**: `jsonb` with operation result
- **Usage**: Admin dashboard to activate/deactivate students

### `activate_student_account(student_profile_id, admin_user_id, subscription_months, payment_amount, payment_method, payment_notes)`
- **Purpose**: Activates a student account with subscription details
- **Returns**: `boolean`
- **Usage**: Admin dashboard to activate student accounts

### `deactivate_student_account(student_profile_id, admin_user_id, reason)`
- **Purpose**: Deactivates a student account
- **Returns**: `boolean`
- **Usage**: Admin dashboard to deactivate student accounts

## RLS Policies

The system implements comprehensive Row Level Security policies:

### Admin Bypass
All tables have admin bypass policies that allow admins full access:
```sql
CREATE POLICY "Admin full access to [table]" ON public.[table]
  FOR ALL USING (public.is_admin());
```

### User-Specific Policies
- **Chapters**: Users can read, admins can modify
- **Exercises**: Public exercises for all, private for active students, admins see all
- **Levels**: Read-only for users, full access for admins
- **Subjects**: Read-only for users, full access for admins
- **Student Profiles**: Users can manage their own, admins can manage all
- **User Progress**: Users can manage their own, admins can manage all

## Setup Instructions

### 1. Apply Database Changes

First, apply the comprehensive RLS policies:

```bash
# Run the SQL script to update RLS policies
psql -h your-db-host -U your-db-user -d your-db-name -f comprehensive-admin-rls-policies.sql
```

### 2. Set Up Admin User

Use the provided script to set up an admin user:

```bash
# Install dependencies if needed
npm install dotenv

# Set up admin user
node scripts/setup-admin-complete.mjs your-email@example.com
```

### 3. Environment Variables

Ensure you have the required environment variables:

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Admin Dashboard Access

### Protected Routes

The following routes are protected by `AdminGuard`:

- `/admin` - Main admin dashboard
- `/admin/levels` - Level management
- `/admin/subjects` - Subject management
- `/admin/chapters` - Chapter management
- `/admin/exercises` - Exercise management
- `/admin/users` - User management
- `/admin/students` - Student management
- `/admin/exercise-visibility` - Exercise visibility management

### Admin Guard

The `AdminGuard` component:
1. Checks if user is authenticated
2. Calls the `is_admin()` function to verify admin status
3. Redirects non-admin users to home page
4. Shows loading state while checking admin status

## Admin API Functions

### User Management

```typescript
import { 
  isCurrentUserAdmin, 
  getAllUsers, 
  getAdminUsers,
  setUserAsAdmin,
  removeAdminRole 
} from '@/lib/api/admin'

// Check if current user is admin
const isAdmin = await isCurrentUserAdmin()

// Get all users (admin only)
const users = await getAllUsers()

// Get admin users only
const admins = await getAdminUsers()

// Set user as admin
await setUserAsAdmin('user@example.com')

// Remove admin role
await removeAdminRole('user@example.com')
```

### Student Management

```typescript
import { 
  getStudentProfiles,
  updateStudentStatus,
  activateStudentAccount,
  deactivateStudentAccount 
} from '@/lib/api/admin'

// Get all student profiles
const students = await getStudentProfiles()

// Update student status
await updateStudentStatus(userId, true, 'Account activated')

// Activate student account
await activateStudentAccount(profileId, 3, 99.99, 'credit_card', 'Payment received')

// Deactivate student account
await deactivateStudentAccount(profileId, 'Payment overdue')
```

### Exercise Management

```typescript
import { 
  getUserAccessibleExercises,
  canAccessExercise 
} from '@/lib/api/admin'

// Get exercises accessible to user
const exercises = await getUserAccessibleExercises(userId)

// Check if user can access specific exercise
const canAccess = await canAccessExercise(exerciseId)
```

## Security Features

### 1. Database-Level Security
- All admin functions use `SECURITY DEFINER`
- RLS policies enforce access control at database level
- Admin status checked via database function

### 2. Application-Level Security
- Admin routes protected by `AdminGuard`
- Admin API functions check admin status before operations
- Service role key used only for admin operations

### 3. Error Handling
- Comprehensive error handling in all admin functions
- Graceful fallbacks for permission denied scenarios
- Detailed logging for debugging

## Testing the Admin System

### 1. Test Admin Access
```bash
# Test admin functions
node scripts/setup-admin-complete.mjs your-email@example.com
```

### 2. Test Admin Dashboard
1. Log in with admin account
2. Navigate to `/admin`
3. Verify all admin features are accessible
4. Test user management functions
5. Test student management functions

### 3. Test Non-Admin Access
1. Log in with regular user account
2. Try to access `/admin` routes
3. Verify redirect to home page
4. Test that admin API calls fail

## Troubleshooting

### Common Issues

1. **Admin Guard Loading Forever**
   - Check if `is_admin()` function exists in database
   - Verify user has admin role in metadata
   - Check network connectivity

2. **Permission Denied Errors**
   - Verify RLS policies are applied
   - Check if user has admin role
   - Ensure admin functions are granted to authenticated role

3. **Admin API Failures**
   - Check service role key configuration
   - Verify admin functions exist in database
   - Check user permissions

### Debug Commands

```sql
-- Check if admin function exists
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' AND routine_name = 'is_admin';

-- Check user metadata
SELECT id, email, raw_user_meta_data 
FROM auth.users 
WHERE email = 'your-email@example.com';

-- Check RLS policies
SELECT schemaname, tablename, policyname, cmd, permissive
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, cmd;
```

## Best Practices

1. **Always check admin status** before performing admin operations
2. **Use the provided admin functions** instead of direct database access
3. **Test admin functionality** after any changes
4. **Monitor admin access** and log admin actions
5. **Regularly review admin users** and remove unnecessary admin privileges
6. **Use environment variables** for sensitive configuration
7. **Implement proper error handling** in all admin operations

## Support

For issues with the admin system:

1. Check the troubleshooting section above
2. Review the database functions and RLS policies
3. Test with the provided setup script
4. Check application logs for detailed error messages
5. Verify environment variable configuration
