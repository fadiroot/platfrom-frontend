-- Migration: Add user activation fields and required database functions
-- This migration adds user activation functionality and creates the missing database functions

-- Add user activation fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_type VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS activated_by UUID REFERENCES users(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS activated_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE users ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add is_public field to exercises table
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;

-- Create user_activation_history table
CREATE TABLE IF NOT EXISTS user_activation_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  changed_by UUID REFERENCES users(id),
  old_status BOOLEAN,
  new_status BOOLEAN,
  old_subscription_end TIMESTAMP,
  new_subscription_end TIMESTAMP,
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create user_roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create user_status_view
CREATE OR REPLACE VIEW user_status_view AS
SELECT 
  u.*,
  CASE 
    WHEN u.is_active = true AND (u.subscription_end_date IS NULL OR u.subscription_end_date > NOW()) THEN 'active'
    WHEN u.is_active = true AND u.subscription_end_date <= NOW() THEN 'expired'
    ELSE 'inactive'
  END as status,
  CASE 
    WHEN u.subscription_end_date IS NULL THEN 'unlimited'
    WHEN u.subscription_end_date > NOW() THEN EXTRACT(days FROM u.subscription_end_date - NOW())::text || ' days'
    ELSE 'expired'
  END as time_remaining
FROM users u;

-- Function: Get user accessible exercises
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
  -- Check if user is active and has valid subscription
  IF EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = user_uuid 
    AND users.is_active = true 
    AND (users.subscription_end_date IS NULL OR users.subscription_end_date > NOW())
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

-- Function: Check if user can access specific exercise
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
  
  IF user_uuid IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if exercise is public
  SELECT is_public INTO is_exercise_public
  FROM exercises
  WHERE id = exercise_id;
  
  -- If exercise is public, allow access
  IF is_exercise_public = true THEN
    RETURN true;
  END IF;
  
  -- Check user activation status and subscription
  SELECT 
    is_active,
    (subscription_end_date IS NULL OR subscription_end_date > NOW())
  INTO is_user_active, subscription_valid
  FROM users
  WHERE id = user_uuid;
  
  -- Allow access if user is active and subscription is valid
  RETURN (is_user_active = true AND subscription_valid = true);
END;
$$;

-- Function: Get admin exercises (for admin users)
CREATE OR REPLACE FUNCTION get_admin_exercises()
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
DECLARE
  user_uuid UUID;
BEGIN
  -- Get current user
  user_uuid := auth.uid();
  
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = user_uuid 
    AND role IN ('admin', 'super_admin')
    AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  
  -- Return all exercises for admin users
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
END;
$$;

-- Function: Log user activation changes
CREATE OR REPLACE FUNCTION log_user_activation_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only log if activation status or subscription end date changed
  IF (OLD.is_active IS DISTINCT FROM NEW.is_active) OR 
     (OLD.subscription_end_date IS DISTINCT FROM NEW.subscription_end_date) THEN
    
    INSERT INTO user_activation_history (
      user_id,
      changed_by,
      old_status,
      new_status,
      old_subscription_end,
      new_subscription_end,
      reason
    ) VALUES (
      NEW.id,
      auth.uid(),
      OLD.is_active,
      NEW.is_active,
      OLD.subscription_end_date,
      NEW.subscription_end_date,
      'Status changed'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for logging activation changes
DROP TRIGGER IF EXISTS user_activation_change_trigger ON users;
CREATE TRIGGER user_activation_change_trigger
  AFTER UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION log_user_activation_change();

-- Update RLS policies

-- Policy for exercises table to handle public/private access
DROP POLICY IF EXISTS "Users can view accessible exercises" ON exercises;
CREATE POLICY "Users can view accessible exercises" ON exercises
FOR SELECT USING (
  is_public = true OR
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.is_active = true 
    AND (users.subscription_end_date IS NULL OR users.subscription_end_date > NOW())
  )
);

-- Policy for user_activation_history (admin only)
DROP POLICY IF EXISTS "Admins can view activation history" ON user_activation_history;
CREATE POLICY "Admins can view activation history" ON user_activation_history
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'super_admin')
    AND user_roles.is_active = true
  )
);

-- Policy for user_roles (admin only)
DROP POLICY IF EXISTS "Admins can manage user roles" ON user_roles;
CREATE POLICY "Admins can manage user roles" ON user_roles
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('admin', 'super_admin')
    AND ur.is_active = true
  )
);

-- Enable RLS on new tables
ALTER TABLE user_activation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON user_status_view TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_accessible_exercises(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION can_access_exercise(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_exercises() TO authenticated;

-- Insert some sample data for testing (optional)
-- Mark first few exercises as public for testing
UPDATE exercises 
SET is_public = true 
WHERE id IN (
  SELECT id FROM exercises 
  ORDER BY created_at 
  LIMIT 3
);

-- Create a sample admin user role (replace with actual admin user ID)
-- INSERT INTO user_roles (user_id, role) 
-- VALUES ('your-admin-user-id-here', 'admin')
-- ON CONFLICT DO NOTHING;

COMMIT;