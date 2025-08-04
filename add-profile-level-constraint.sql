-- =============================================
-- Add Foreign Key Constraint for profiles.level_id
-- =============================================

-- Add foreign key constraint to profiles table
ALTER TABLE public.profiles 
ADD CONSTRAINT fk_profiles_level_id 
FOREIGN KEY (level_id) REFERENCES public.levels(id) ON DELETE SET NULL;

-- Update RLS policy for profiles to include level access
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.profiles;
CREATE POLICY "Enable read access for authenticated users" ON public.profiles
FOR SELECT 
TO authenticated 
USING (true);

-- Update RLS policy for profiles updates
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.profiles;
CREATE POLICY "Enable update for users based on user_id" ON public.profiles
FOR UPDATE 
TO authenticated 
USING (auth.uid() = id);

-- Insert policy for profiles
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.profiles;
CREATE POLICY "Enable insert access for authenticated users" ON public.profiles
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = id);