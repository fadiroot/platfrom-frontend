-- Migration: Create student_profile table
-- This migration creates the student_profile table to replace the missing profiles table
-- and properly link users with their levels and subscription information

BEGIN;

-- Create student_profile table
CREATE TABLE IF NOT EXISTS student_profile (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  level_id UUID REFERENCES levels(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT false,
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_student_profile_user_id ON student_profile(user_id);
CREATE INDEX IF NOT EXISTS idx_student_profile_level_id ON student_profile(level_id);
CREATE INDEX IF NOT EXISTS idx_student_profile_is_active ON student_profile(is_active);
CREATE INDEX IF NOT EXISTS idx_student_profile_subscription_end ON student_profile(subscription_end_date);

-- Enable RLS on student_profile table
ALTER TABLE student_profile ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for student_profile
-- Users can view their own profile
CREATE POLICY "Users can view own student profile" ON student_profile
  FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own profile (limited fields)
CREATE POLICY "Users can update own student profile" ON student_profile
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all student profiles" ON student_profile
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('admin', 'super_admin')
      AND ur.is_active = true
    )
  );

-- Admins can update all profiles
CREATE POLICY "Admins can update all student profiles" ON student_profile
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('admin', 'super_admin')
      AND ur.is_active = true
    )
  );

-- Admins can insert new profiles
CREATE POLICY "Admins can insert student profiles" ON student_profile
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('admin', 'super_admin')
      AND ur.is_active = true
    )
  );

-- Function to automatically create student profile on user registration
CREATE OR REPLACE FUNCTION create_student_profile_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- Extract level_id from user metadata if available
  INSERT INTO student_profile (user_id, level_id, created_at)
  VALUES (
    NEW.id,
    CASE 
      WHEN NEW.raw_user_meta_data->>'levelId' IS NOT NULL 
      THEN (NEW.raw_user_meta_data->>'levelId')::UUID
      ELSE NULL
    END,
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

-- Create trigger to automatically create student profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_student_profile_on_signup();

-- Update the user status view to use student_profile instead of users table
CREATE OR REPLACE VIEW user_status_view AS
SELECT 
  u.id,
  u.email,
  u.created_at,
  u.last_sign_in_at,
  u.raw_user_meta_data,
  sp.is_active,
  sp.subscription_type,
  sp.subscription_start_date,
  sp.subscription_end_date,
  sp.payment_status,
  sp.activated_by,
  sp.activated_at,
  CASE 
    WHEN sp.is_active = true AND (sp.subscription_end_date IS NULL OR sp.subscription_end_date > NOW()) THEN 'active'
    WHEN sp.is_active = true AND sp.subscription_end_date <= NOW() THEN 'expired'
    ELSE 'inactive'
  END as status,
  CASE 
    WHEN sp.subscription_end_date IS NULL THEN 'unlimited'
    WHEN sp.subscription_end_date > NOW() THEN EXTRACT(days FROM sp.subscription_end_date - NOW())::text || ' days'
    ELSE 'expired'
  END as time_remaining
FROM auth.users u
LEFT JOIN student_profile sp ON u.id = sp.user_id;

-- Update the get_user_accessible_exercises function to use student_profile
CREATE OR REPLACE FUNCTION get_user_accessible_exercises(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  name VARCHAR,
  tag INTEGER,
  difficulty VARCHAR,
  chapter_id UUID,
  exercise_file_urls TEXT[],
  correction_file_urls TEXT[],
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  is_public BOOLEAN,
  chapter_title VARCHAR,
  subject_title VARCHAR,
  subject_id UUID,
  level_title VARCHAR,
  level_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is active and has valid subscription using student_profile
  IF EXISTS (
    SELECT 1 FROM student_profile sp
    WHERE sp.user_id = user_uuid 
    AND sp.is_active = true 
    AND (sp.subscription_end_date IS NULL OR sp.subscription_end_date > NOW())
  ) THEN
    -- Return all exercises for active users
    RETURN QUERY
    SELECT 
      e.id,
      e.name,
      e.tag,
      e.difficulty::VARCHAR,
      e.chapter_id,
      e.exercise_file_urls,
      e.correction_file_urls,
      e.created_at,
      e.updated_at,
      e.is_public,
      c.title as chapter_title,
      s.title as subject_title,
      s.id as subject_id,
      l.title as level_title,
      l.id as level_id
    FROM exercises e
    LEFT JOIN chapters c ON e.chapter_id = c.id
    LEFT JOIN subjects s ON c.subject_id = s.id
    LEFT JOIN levels l ON s.level_id = l.id
    ORDER BY e.created_at DESC;
  ELSE
    -- Return only public exercises for inactive users
    RETURN QUERY
    SELECT 
      e.id,
      e.name,
      e.tag,
      e.difficulty::VARCHAR,
      e.chapter_id,
      e.exercise_file_urls,
      e.correction_file_urls,
      e.created_at,
      e.updated_at,
      e.is_public,
      c.title as chapter_title,
      s.title as subject_title,
      s.id as subject_id,
      l.title as level_title,
      l.id as level_id
    FROM exercises e
    LEFT JOIN chapters c ON e.chapter_id = c.id
    LEFT JOIN subjects s ON c.subject_id = s.id
    LEFT JOIN levels l ON s.level_id = l.id
    WHERE e.is_public = true
    ORDER BY e.created_at DESC;
  END IF;
END;
$$;

-- Update the can_access_exercise function to use student_profile
CREATE OR REPLACE FUNCTION can_access_exercise(exercise_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_uuid UUID;
  is_exercise_public BOOLEAN;
  is_user_active BOOLEAN;
  subscription_valid BOOLEAN;
BEGIN
  -- Get current user
  user_uuid := auth.uid();
  
  -- If no user is logged in, only allow public exercises
  IF user_uuid IS NULL THEN
    SELECT is_public INTO is_exercise_public FROM exercises WHERE id = exercise_id;
    RETURN COALESCE(is_exercise_public, false);
  END IF;
  
  -- Check if exercise is public
  SELECT is_public INTO is_exercise_public FROM exercises WHERE id = exercise_id;
  
  -- If exercise is public, allow access
  IF is_exercise_public = true THEN
    RETURN true;
  END IF;
  
  -- Check user activation status and subscription using student_profile
  SELECT 
    sp.is_active,
    (sp.subscription_end_date IS NULL OR sp.subscription_end_date > NOW())
  INTO is_user_active, subscription_valid
  FROM student_profile sp
  WHERE sp.user_id = user_uuid;
  
  -- Allow access if user is active and has valid subscription
  RETURN COALESCE(is_user_active, false) AND COALESCE(subscription_valid, false);
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON student_profile TO authenticated;
GRANT SELECT ON user_status_view TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_accessible_exercises(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION can_access_exercise(UUID) TO authenticated;

COMMIT;