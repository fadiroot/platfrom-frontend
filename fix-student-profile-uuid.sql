-- Fix student_profile table to use UUID for level_id
-- This assumes your levels table uses UUID for id

-- Option 1: If you have no important data, drop and recreate
-- DROP TABLE IF EXISTS public.student_profile;

-- Option 2: If you have data, modify the existing table
-- First, if you have existing data with BIGINT level_id, you'll need to clear it
-- DELETE FROM public.student_profile;

-- Then alter the column type
ALTER TABLE public.student_profile 
ALTER COLUMN level_id TYPE UUID USING level_id::text::uuid;

-- Add foreign key constraint if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'student_profile_level_id_fkey'
  ) THEN
    ALTER TABLE public.student_profile 
    ADD CONSTRAINT student_profile_level_id_fkey 
    FOREIGN KEY (level_id) REFERENCES public.levels(id) ON DELETE CASCADE;
  END IF;
END $$;

-- OR create fresh table if you prefer:
/*
CREATE TABLE public.student_profile (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    level_id UUID NOT NULL REFERENCES public.levels(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE public.student_profile ENABLE ROW LEVEL SECURITY;

-- Create indexes for foreign keys for performance
CREATE INDEX IF NOT EXISTS idx_student_profile_user_id ON public.student_profile(user_id);
CREATE INDEX IF NOT EXISTS idx_student_profile_level_id ON public.student_profile(level_id);

-- Add RLS policies
CREATE POLICY "Users can view their own profile" ON public.student_profile
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.student_profile
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.student_profile
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Admin policy (adjust as needed)  
CREATE POLICY "Enable full access for authenticated users" ON public.student_profile
FOR ALL TO authenticated USING (true);
*/