# 🚫 Student Account Deactivation by Default Implementation

## 📋 Overview

This implementation ensures that **all new student accounts are deactivated by default** during the signup process. Students must be manually activated by an admin before they can access the platform.

## ✅ What Was Implemented

### 1. **Database Level**
- **Table Structure**: The `student_profile` table already has `is_active BOOLEAN DEFAULT false`
- **Trigger Function**: Updated to explicitly set `is_active = false` when creating student profiles
- **Migration**: Created `migrations/update_student_profile_trigger.sql` to ensure consistency

### 2. **Application Level**
- **API Function**: Updated `createStudentProfile()` in `src/lib/api/auth.ts` to explicitly set `is_active: false`
- **Signup Process**: All student profiles created during signup are now deactivated by default

### 3. **Admin Control**
- **Student Management**: Admins can activate/deactivate student accounts through the admin dashboard
- **Activation Process**: Admins can set subscription details when activating accounts

## 🔧 Technical Details

### Database Trigger Function
```sql
CREATE OR REPLACE FUNCTION create_student_profile_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO student_profile (user_id, level_id, is_active, created_at, updated_at)
  VALUES (
    NEW.id,
    level_id_uuid,
    false, -- Explicitly set to false - student accounts are deactivated by default
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### API Function
```typescript
export const createStudentProfile = async (userId: string, levelId: string) => {
  const { data, error } = await supabase
    .from('student_profile')
    .insert({
      user_id: userId,
      level_id: levelId,
      is_active: false // Explicitly set to false - student accounts are deactivated by default
    })
    .select()
    .single()
}
```

## 🎯 Workflow

### 1. **Student Signup Process**
1. Student fills out registration form
2. Account is created in `auth.users` table
3. Trigger automatically creates `student_profile` with `is_active = false`
4. Student account is **deactivated by default**

### 2. **Admin Activation Process**
1. Admin logs into admin dashboard
2. Navigates to "Student Management"
3. Views list of deactivated students
4. Clicks "Activate" button for specific student
5. Sets subscription details (type, duration, payment info)
6. Student account becomes active

### 3. **Student Access**
- **Before Activation**: Student cannot access premium content or exercises
- **After Activation**: Student has full access based on subscription level

## 🔒 Security Benefits

1. **Controlled Access**: No unauthorized access to premium content
2. **Admin Oversight**: All student accounts require admin approval
3. **Payment Verification**: Admins can verify payment before activation
4. **Fraud Prevention**: Prevents automatic account creation abuse

## 📊 Database Schema

```sql
CREATE TABLE student_profile (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  level_id UUID REFERENCES levels(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT false, -- ← This ensures deactivation by default
  subscription_type VARCHAR(50),
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

## 🚀 Migration Instructions

To apply these changes to your database:

1. **Run the migration**:
   ```sql
   -- Execute the content of migrations/update_student_profile_trigger.sql
   ```

2. **Verify the changes**:
   ```sql
   -- Check that the trigger function is updated
   SELECT routine_definition 
   FROM information_schema.routines 
   WHERE routine_name = 'create_student_profile_on_signup';
   ```

3. **Test the signup process**:
   - Create a new student account
   - Verify that `is_active = false` in the database
   - Test admin activation process

## 📝 Notes

- **Existing Accounts**: This change only affects new accounts created after the migration
- **Admin Accounts**: Admin accounts are not affected by this change
- **Backward Compatibility**: All existing functionality remains intact
- **Error Handling**: The system gracefully handles activation/deactivation errors

## 🎉 Result

✅ **All new student accounts are now deactivated by default**  
✅ **Admins have full control over student access**  
✅ **Enhanced security and payment verification**  
✅ **Consistent behavior across all signup methods**
