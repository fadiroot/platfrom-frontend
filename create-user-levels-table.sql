-- =============================================
-- Create User Levels Table - Best Approach
-- This is cleaner than storing in auth metadata
-- =============================================

-- Create user_levels table to map users to their levels
CREATE TABLE IF NOT EXISTS public.user_levels (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    level_id UUID REFERENCES public.levels(id) ON DELETE CASCADE NOT NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id) -- Each user can only have one level
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_user_levels_user_id ON public.user_levels(user_id);
CREATE INDEX IF NOT EXISTS idx_user_levels_level_id ON public.user_levels(level_id);

-- Enable RLS
ALTER TABLE public.user_levels ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own level" ON public.user_levels
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own level" ON public.user_levels
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own level" ON public.user_levels
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Admin can manage all user levels (for your admin dashboard)
CREATE POLICY "Enable full access for authenticated users" ON public.user_levels
FOR ALL TO authenticated USING (true);

-- =============================================
-- Function to get user with level information
-- =============================================

-- Function to get user level (this will be called from your app)
CREATE OR REPLACE FUNCTION public.get_user_level(user_uuid UUID)
RETURNS TABLE (
    user_id UUID,
    level_id UUID,
    level_title TEXT,
    level_description TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ul.user_id,
        ul.level_id,
        l.title,
        l.description
    FROM public.user_levels ul
    JOIN public.levels l ON ul.level_id = l.id
    WHERE ul.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_user_level(UUID) TO authenticated;

-- =============================================
-- Insert/Update user level functions
-- =============================================

-- Function to set user level (for registration and updates)
CREATE OR REPLACE FUNCTION public.set_user_level(
    user_uuid UUID,
    new_level_id UUID
)
RETURNS void AS $$
BEGIN
    -- Insert or update user level
    INSERT INTO public.user_levels (user_id, level_id)
    VALUES (user_uuid, new_level_id)
    ON CONFLICT (user_id)
    DO UPDATE SET 
        level_id = EXCLUDED.level_id,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.set_user_level(UUID, UUID) TO authenticated;

-- =============================================
-- Migrate existing users (if any have level_id in metadata)
-- =============================================

-- Migrate users who have level_id in their metadata to the new table
INSERT INTO public.user_levels (user_id, level_id)
SELECT 
    u.id,
    (u.raw_user_meta_data->>'level_id')::UUID
FROM auth.users u
WHERE u.raw_user_meta_data->>'level_id' IS NOT NULL
AND (u.raw_user_meta_data->>'level_id')::UUID IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;

-- =============================================
-- Verify the setup
-- =============================================

-- Check the table was created
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_levels' 
AND table_schema = 'public';

-- Check if any users were migrated
SELECT COUNT(*) as migrated_users FROM public.user_levels;