-- =============================================
-- Supabase Database Schema for Educational Platform
-- Hierarchy: Level → Subject → Chapter → Exercise
-- =============================================

-- Enable Row Level Security
SET session_replication_role = replica;

-- =============================================
-- 1. User Profiles Table (extends auth.users)
-- =============================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT,
    last_name TEXT,
    username TEXT UNIQUE,
    phone TEXT,
    age INTEGER,
    birth_date DATE,
    level_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (id)
);

-- =============================================
-- 2. Levels Table
-- =============================================
CREATE TABLE IF NOT EXISTS public.levels (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 3. Subjects Table
-- =============================================
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    level_id UUID REFERENCES public.levels(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 4. Chapters Table
-- =============================================
CREATE TABLE IF NOT EXISTS public.chapters (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    exercise_count INTEGER DEFAULT 0,
    estimated_time TEXT,
    difficulty TEXT CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
    type TEXT CHECK (type IN ('Theory', 'Practical', 'Assessment')),
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 5. Exercises Table
-- =============================================
CREATE TABLE IF NOT EXISTS public.exercises (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    tag INTEGER,
    difficulty TEXT CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
    chapter_id UUID REFERENCES public.chapters(id) ON DELETE CASCADE,
    exercise_file_urls TEXT[], -- Array of PDF URLs for problems
    correction_file_urls TEXT[], -- Array of PDF URLs for corrections
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 6. User Progress Table
-- =============================================
CREATE TABLE IF NOT EXISTS public.user_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    exercise_id UUID REFERENCES public.exercises(id) ON DELETE CASCADE,
    chapter_id UUID REFERENCES public.chapters(id) ON DELETE CASCADE,
    completed BOOLEAN DEFAULT FALSE,
    completion_date TIMESTAMP WITH TIME ZONE,
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, exercise_id)
);

-- =============================================
-- Foreign Key Constraints & Indexes
-- =============================================

-- Add foreign key to profiles table for level_id
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_level_id_fkey 
FOREIGN KEY (level_id) REFERENCES public.levels(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subjects_level_id ON public.subjects(level_id);
CREATE INDEX IF NOT EXISTS idx_chapters_subject_id ON public.chapters(subject_id);
CREATE INDEX IF NOT EXISTS idx_exercises_chapter_id ON public.exercises(chapter_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON public.user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_exercise_id ON public.user_progress(exercise_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_chapter_id ON public.user_progress(chapter_id);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- =============================================
-- Row Level Security (RLS) Policies
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can only see and update their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Levels: Public read access (all users can view levels)
CREATE POLICY "Levels are viewable by authenticated users" ON public.levels
    FOR SELECT USING (auth.role() = 'authenticated');

-- Subjects: Public read access (all users can view subjects)
CREATE POLICY "Subjects are viewable by authenticated users" ON public.subjects
    FOR SELECT USING (auth.role() = 'authenticated');

-- Chapters: Public read access (all users can view chapters)
CREATE POLICY "Chapters are viewable by authenticated users" ON public.chapters
    FOR SELECT USING (auth.role() = 'authenticated');

-- Exercises: Public read access (all users can view exercises)
CREATE POLICY "Exercises are viewable by authenticated users" ON public.exercises
    FOR SELECT USING (auth.role() = 'authenticated');

-- User Progress: Users can only access their own progress
CREATE POLICY "Users can view own progress" ON public.user_progress
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress" ON public.user_progress
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" ON public.user_progress
    FOR UPDATE USING (auth.uid() = user_id);

-- =============================================
-- Functions for automated tasks
-- =============================================

-- Function to update chapter exercise count when exercises are added/removed
CREATE OR REPLACE FUNCTION update_chapter_exercise_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.chapters 
        SET exercise_count = exercise_count + 1,
            updated_at = NOW()
        WHERE id = NEW.chapter_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.chapters 
        SET exercise_count = exercise_count - 1,
            updated_at = NOW()
        WHERE id = OLD.chapter_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update exercise count
CREATE TRIGGER trigger_update_chapter_exercise_count
    AFTER INSERT OR DELETE ON public.exercises
    FOR EACH ROW EXECUTE FUNCTION update_chapter_exercise_count();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_levels_updated_at BEFORE UPDATE ON public.levels FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON public.subjects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chapters_updated_at BEFORE UPDATE ON public.chapters FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_exercises_updated_at BEFORE UPDATE ON public.exercises FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_progress_updated_at BEFORE UPDATE ON public.user_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- Sample Data (Optional)
-- =============================================

-- Insert sample levels
INSERT INTO public.levels (id, title, description) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'Beginner', 'Introduction to programming concepts'),
    ('550e8400-e29b-41d4-a716-446655440002', 'Intermediate', 'Advanced programming techniques'),
    ('550e8400-e29b-41d4-a716-446655440003', 'Advanced', 'Expert level programming and algorithms')
ON CONFLICT (id) DO NOTHING;

-- Insert sample subjects
INSERT INTO public.subjects (id, title, description, level_id) VALUES
    ('660e8400-e29b-41d4-a716-446655440001', 'Data Structures & Algorithms', 'Learn fundamental data structures and algorithms', '550e8400-e29b-41d4-a716-446655440001'),
    ('660e8400-e29b-41d4-a716-446655440002', 'Software Engineering Principles', 'Best practices in software development', '550e8400-e29b-41d4-a716-446655440001'),
    ('660e8400-e29b-41d4-a716-446655440003', 'Database Management Systems', 'Database design and management', '550e8400-e29b-41d4-a716-446655440002')
ON CONFLICT (id) DO NOTHING;

RESET session_replication_role;