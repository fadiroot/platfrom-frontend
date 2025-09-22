import { supabase } from '../supabase'
import type { Tables } from '../supabase'

export type Chapter = Tables<'chapters'>

// Get all chapters
export const getChapters = async (): Promise<Chapter[]> => {
  const { data, error } = await supabase
    .from('chapters')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch chapters: ${error.message}`)
  }

  return data || []
}

// Get chapters by subject ID
export const getChaptersBySubject = async (subjectId: string): Promise<Chapter[]> => {
  const { data, error } = await supabase
    .from('chapters')
    .select(
      `
      *,
      exercises:user_accessible_exercises(count)
    `
    )
    .eq('subject_id', subjectId)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch chapters by subject: ${error.message}`)
  }

  // Transform the data to include exercise_count
  const transformedData =
    data?.map((chapter) => ({
      ...chapter,
      exercise_count: chapter.exercises?.[0]?.count || 0,
    })) || []

  return transformedData
}

// Get chapters by level ID (through subjects)
export const getChaptersByLevel = async (levelId: string): Promise<Chapter[]> => {
  const { data, error } = await supabase
    .from('chapters')
    .select(
      `
      *,
      subject:subjects!inner(
        id,
        subject_levels!inner(
          level_id
        )
      ),
      exercises:user_accessible_exercises(count)
    `
    )
    .eq('subject.subject_levels.level_id', levelId)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch chapters by level: ${error.message}`)
  }

  // Transform the data to include exercise_count
  const transformedData =
    data?.map((chapter) => ({
      ...chapter,
      exercise_count: chapter.exercises?.[0]?.count || 0,
    })) || []

  return transformedData
}

// Get chapter by ID
export const getChapterById = async (id: string): Promise<Chapter | null> => {
  const { data, error } = await supabase.from('chapters').select('*').eq('id', id).single()

  if (error) {
    throw new Error(`Failed to fetch chapter: ${error.message}`)
  }

  return data
}

// Get chapters with subject and level information
export const getChaptersWithDetails = async (): Promise<
  (Chapter & {
    subject: (Tables<'subjects'> & { levels: Tables<'levels'>[] }) | null
  })[]
> => {
  const { data, error } = await supabase
    .from('chapters')
    .select(
      `
      *,
      subject:subjects(
        *,
        subject_levels(
          level:levels(*)
        )
      )
    `
    )
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch chapters with details: ${error.message}`)
  }

  // Transform the data to flatten the levels array
  const transformedData = (data || []).map((chapter) => ({
    ...chapter,
    subject: chapter.subject ? {
      ...chapter.subject,
      levels: chapter.subject.subject_levels?.map((sl: any) => sl.level).filter(Boolean) || []
    } : null
  }))

  return transformedData
}

// Get chapter with progress for a specific user
export const getChapterWithProgress = async (
  chapterId: string,
  userId: string
): Promise<Chapter & { progress?: number }> => {
  // First get the chapter
  const { data: chapter, error: chapterError } = await supabase
    .from('chapters')
    .select('*')
    .eq('id', chapterId)
    .single()

  if (chapterError) {
    throw new Error(`Failed to fetch chapter: ${chapterError.message}`)
  }

  // Then get user progress for this chapter
  const { data: progressData, error: progressError } = await supabase
    .from('user_progress')
    .select('progress_percentage')
    .eq('chapter_id', chapterId)
    .eq('user_id', userId)

  if (progressError) {
    // If no progress found, that's okay - just return 0
    return { ...chapter, progress: 0 }
  }

  // Calculate average progress percentage for the chapter
  const averageProgress =
    progressData.length > 0
      ? progressData.reduce((sum, p) => sum + (p.progress_percentage || 0), 0) / progressData.length
      : 0

  return { ...chapter, progress: averageProgress }
}

// Create new chapter (for admin)
export const createChapter = async (
  chapterData: Omit<Chapter, 'id' | 'created_at' | 'updated_at'>
): Promise<Chapter> => {
  const { data, error } = await supabase.from('chapters').insert(chapterData).select().single()

  if (error) {
    throw new Error(`Failed to create chapter: ${error.message}`)
  }

  return data
}

// Update chapter (for admin)
export const updateChapter = async (
  id: string,
  chapterData: Partial<Omit<Chapter, 'id' | 'created_at' | 'updated_at'>>
): Promise<Chapter> => {
  const { data, error } = await supabase
    .from('chapters')
    .update(chapterData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update chapter: ${error.message}`)
  }

  return data
}

// Delete chapter (for admin)
export const deleteChapter = async (id: string): Promise<void> => {
  const { error } = await supabase.from('chapters').delete().eq('id', id)

  if (error) {
    throw new Error(`Failed to delete chapter: ${error.message}`)
  }
}
