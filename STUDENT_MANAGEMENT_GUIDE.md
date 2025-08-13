# Student Management System Guide

## Overview

The Student Management System provides comprehensive admin capabilities to manage student accounts, subscriptions, and exercise access control. This system integrates with the existing admin dashboard and provides granular control over student access to exercises.

## Key Features

### 🎯 **Student Account Management**
- **View All Students**: Complete list of all student profiles with detailed information
- **Activate Accounts**: Enable student accounts with subscription details
- **Deactivate Accounts**: Disable student accounts with optional reasons
- **Subscription Management**: Set subscription periods and payment information
- **Status Tracking**: Monitor active, inactive, and expired accounts

### 🔒 **Exercise Access Control**
- **Active Students**: Can access ALL exercises (public and private)
- **Inactive Students**: Can only access PUBLIC exercises
- **Automatic Enforcement**: Access control is enforced at the database level
- **Real-time Updates**: Changes take effect immediately

### 📊 **Admin Dashboard Features**
- **Statistics Cards**: Overview of total, active, inactive, and expired students
- **Advanced Filtering**: Filter by status, payment status, and search by name/email
- **Bulk Operations**: Manage multiple students efficiently
- **Detailed Views**: Complete student information and history

## Database Structure

### Student Profile Table
```sql
CREATE TABLE student_profile (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  level_id UUID REFERENCES levels(id),
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

### Key Fields
- **`is_active`**: Controls whether student can access private exercises
- **`subscription_end_date`**: Determines if subscription is still valid
- **`payment_status`**: Tracks payment status (pending, paid, failed, refunded)
- **`activated_by`/`deactivated_by`**: Audit trail of admin actions

## Exercise Access Logic

### Access Control Rules
1. **Public Exercises**: Accessible to all authenticated users
2. **Private Exercises**: Only accessible to active students with valid subscriptions
3. **Admin Override**: Admins can access all exercises regardless of student status

### Database Functions
```sql
-- Check if user can access specific exercise
SELECT can_access_exercise(exercise_id);

-- Get all exercises accessible to user
SELECT * FROM get_user_accessible_exercises(user_id);
```

### Access Flow
```
User requests exercise → Check if exercise is public → 
If public: Allow access
If private: Check student_profile.is_active AND subscription_valid → 
If both true: Allow access
If either false: Deny access
```

## Admin Functions

### Get Student Profiles
```typescript
const students = await getStudentProfiles(filters?: StudentFilters);
```

**Filters Available:**
- `status`: 'all' | 'active' | 'inactive' | 'expired'
- `payment_status`: 'pending' | 'paid' | 'failed' | 'refunded'
- `search`: Search by name or email

### Activate Student Account
```typescript
const success = await activateStudentAccount({
  student_profile_id: string,
  subscription_months: number,
  payment_amount?: number,
  payment_method?: string,
  payment_notes?: string
});
```

### Deactivate Student Account
```typescript
const success = await deactivateStudentAccount({
  student_profile_id: string,
  reason?: string
});
```

## Implementation Steps

### 1. Apply Database Enhancements
```bash
# Run the enhancement script
psql -h your-db-host -U your-db-user -d your-db-name -f enhance-student-management-functions.sql
```

### 2. Verify Functions
The script will test and verify:
- `is_admin()` function
- `get_student_profiles()` function
- `can_access_exercise()` function
- `get_user_accessible_exercises()` function
- `activate_student_account()` function
- `deactivate_student_account()` function

### 3. Access Admin Dashboard
1. **Log in as admin**
2. **Navigate to `/admin/students`**
3. **View student list and statistics**
4. **Test activate/deactivate functions**

## Admin Dashboard Usage

### Viewing Students
1. **Navigate to Student Management** in admin dashboard
2. **View statistics** at the top of the page
3. **Use filters** to find specific students
4. **Search** by name or email

### Activating a Student
1. **Find the student** in the list
2. **Click "Activate"** button
3. **Fill in the form**:
   - Subscription period (months)
   - Payment amount (optional)
   - Payment method (optional)
   - Payment notes (optional)
4. **Click "Activate Account"**

### Deactivating a Student
1. **Find the student** in the list
2. **Click "Deactivate"** button
3. **Add reason** (optional)
4. **Click "Deactivate Account"**

### Understanding Status Tags
- **🟢 Active**: Student can access all exercises
- **🔴 Inactive**: Student can only access public exercises
- **🟠 Expired**: Subscription has expired, access limited to public exercises

## Security Features

### Admin Authentication
- All functions check admin status using `is_admin()` function
- Service role key used for admin operations
- Proper error handling for unauthorized access

### Data Protection
- RLS policies protect student data
- Admin functions use `SECURITY DEFINER`
- Audit trail for all admin actions

### Access Control
- Exercise access enforced at database level
- Real-time status checking
- No client-side bypass possible

## Troubleshooting

### Common Issues

#### Issue: Students can't access exercises
1. **Check student status**: Verify `is_active = true` in student_profile
2. **Check subscription**: Verify `subscription_end_date` is not expired
3. **Check exercise visibility**: Verify exercise `is_public` status
4. **Test access function**: Run `SELECT can_access_exercise(exercise_id)`

#### Issue: Admin can't see students
1. **Verify admin status**: Check if user has admin role
2. **Check RLS policies**: Verify admin bypass policies exist
3. **Check function permissions**: Ensure functions are granted to authenticated role

#### Issue: Activate/Deactivate not working
1. **Check admin privileges**: Verify current user is admin
2. **Check student_profile table**: Ensure table structure is correct
3. **Check function errors**: Look for database function errors

### Debug Commands

```sql
-- Check student status
SELECT user_id, is_active, subscription_end_date, payment_status 
FROM student_profile 
WHERE user_id = 'target-user-id';

-- Test exercise access
SELECT can_access_exercise('exercise-id');

-- Check admin status
SELECT is_admin();

-- View all students (admin only)
SELECT * FROM get_student_profiles();
```

## Best Practices

### 1. Regular Monitoring
- **Check expired subscriptions** regularly
- **Monitor payment status** for pending payments
- **Review deactivation reasons** for patterns

### 2. Data Management
- **Keep payment notes** for audit trail
- **Use consistent payment methods** for tracking
- **Set appropriate subscription periods**

### 3. Security
- **Regularly review admin users**
- **Monitor admin actions** through audit trail
- **Test access control** regularly

### 4. User Experience
- **Communicate status changes** to students
- **Provide clear feedback** on access limitations
- **Handle edge cases** gracefully

## Integration Points

### With Existing Systems
- **Admin Dashboard**: Integrated into existing admin interface
- **Exercise System**: Automatic access control based on student status
- **User Management**: Leverages existing user authentication
- **Level System**: Links students to appropriate levels

### Future Enhancements
- **Bulk Operations**: Activate/deactivate multiple students
- **Email Notifications**: Notify students of status changes
- **Advanced Reporting**: Detailed analytics and reports
- **Subscription Renewal**: Automatic renewal reminders

## Support

For issues with the Student Management System:

1. **Check the troubleshooting section** above
2. **Verify database functions** are properly installed
3. **Test admin privileges** and access control
4. **Review error logs** for detailed information
5. **Check RLS policies** and permissions

The Student Management System provides a robust, secure, and user-friendly way to manage student access to educational content while maintaining proper access control and audit trails.
