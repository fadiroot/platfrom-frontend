-- =============================================
-- Supabase Migration - Educational Platform
-- WITHOUT PROFILES TABLE
-- Store user data in auth.users metadata instead
-- =============================================

-- =============================================
-- 1. Levels Table
-- =============================================
CREATE TABLE IF NOT EXISTS public.levels (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 2. Subjects Table
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
-- 3. Chapters Table
-- =============================================
CREATE TABLE IF NOT EXISTS public.chapters (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    chapter_order INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 4. Exercises Table
-- =============================================
CREATE TABLE IF NOT EXISTS public.exercises (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
    problem_pdf_url TEXT,
    correction_pdf_url TEXT,
    description TEXT,
    chapter_id UUID REFERENCES public.chapters(id) ON DELETE CASCADE,
    exercise_order INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 5. User Progress Table
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
-- Indexes for better performance
-- =============================================
CREATE INDEX IF NOT EXISTS idx_subjects_level_id ON public.subjects(level_id);
CREATE INDEX IF NOT EXISTS idx_chapters_subject_id ON public.chapters(subject_id);
CREATE INDEX IF NOT EXISTS idx_exercises_chapter_id ON public.exercises(chapter_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON public.user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_exercise_id ON public.user_progress(exercise_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_chapter_id ON public.user_progress(chapter_id);

-- =============================================
-- Row Level Security (RLS) Policies
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for levels (read access for authenticated users)
CREATE POLICY "Enable read access for authenticated users" ON public.levels
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable full access for authenticated users" ON public.levels
FOR ALL TO authenticated USING (true);

-- RLS Policies for subjects
CREATE POLICY "Enable read access for authenticated users" ON public.subjects
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable full access for authenticated users" ON public.subjects
FOR ALL TO authenticated USING (true);

-- RLS Policies for chapters
CREATE POLICY "Enable read access for authenticated users" ON public.chapters
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable full access for authenticated users" ON public.chapters
FOR ALL TO authenticated USING (true);

-- RLS Policies for exercises
CREATE POLICY "Enable read access for authenticated users" ON public.exercises
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable full access for authenticated users" ON public.exercises
FOR ALL TO authenticated USING (true);

-- RLS Policies for user_progress
CREATE POLICY "Users can view their own progress" ON public.user_progress
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress" ON public.user_progress
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress" ON public.user_progress
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own progress" ON public.user_progress
FOR DELETE TO authenticated USING (auth.uid() = user_id);