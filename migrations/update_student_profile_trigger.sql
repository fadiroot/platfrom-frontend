-- Migration: Update student profile trigger to explicitly set is_active to false
-- This ensures that all new student accounts are deactivated by default

BEGIN;

-- Update the trigger function to explicitly set is_active to false
CREATE OR REPLACE FUNCTION create_student_profile_on_signup()
RETURNS TRIGGER AS $$
DECLARE
  level_id_uuid UUID;
BEGIN
  -- Extract level_id from user metadata if available
  IF NEW.raw_user_meta_data->>'levelId' IS NOT NULL THEN
    level_id_uuid := (NEW.raw_user_meta_data->>'levelId')::UUID;
  ELSE
    level_id_uuid := NULL;
  END IF;
  
  -- Insert student profile with is_active explicitly set to false
  INSERT INTO student_profile (user_id, level_id, is_active, created_at, updated_at)
  VALUES (
    NEW.id,
    level_id_uuid,
    false, -- Explicitly set to false - student accounts are deactivated by default
    NOW(),
    NOW()
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the user creation
    RAISE WARNING 'Failed to create student profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- The trigger should already exist, but let's make sure it's using the updated function
-- Drop and recreate the trigger to ensure it uses the updated function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_student_profile_on_signup();

COMMIT;
