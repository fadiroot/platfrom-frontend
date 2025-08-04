import { supabase } from '../supabase'
import type { Tables } from '../supabase'
import { deleteExerciseFiles } from './storage'

export type Exercise = Tables<'exercises'>
export type UserProgress = Tables<'user_progress'>

// Get all exercises
export const getExercises = async (): Promise<Exercise[]> => {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch exercises: ${error.message}`)
  }

  return data || []
}

// Get exercises by chapter ID
export const getExercisesByChapter = async (chapterId: string): Promise<Exercise[]> => {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .eq('chapter_id', chapterId)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch exercises by chapter: ${error.message}`)
  }

  return data || []
}

// Get exercises by subject ID (through chapters)
export const getExercisesBySubject = async (subjectId: string): Promise<Exercise[]> => {
  const { data, error } = await supabase
    .from('exercises')
    .select(`
      *,
      chapter:chapters!inner(
        subject_id
      )
    `)
    .eq('chapter.subject_id', subjectId)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch exercises by subject: ${error.message}`)
  }

  return data || []
}

// Get exercise by ID
export const getExerciseById = async (id: string): Promise<Exercise | null> => {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    throw new Error(`Failed to fetch exercise: ${error.message}`)
  }

  return data
}

// Get exercises with chapter, subject, and level information
export const getExercisesWithDetails = async (): Promise<(Exercise & {
  chapter: Tables<'chapters'> & {
    subject: Tables<'subjects'> & { level: Tables<'levels'> | null } | null
  } | null
})[]> => {
  const { data, error } = await supabase
    .from('exercises')
    .select(`
      *,
      chapter:chapters(
        *,
        subject:subjects(
          *,
          level:levels(*)
        )
      )
    `)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch exercises with details: ${error.message}`)
  }

  return data || []
}

// Get exercises with user progress
export const getExercisesWithProgress = async (userId: string): Promise<(Exercise & { completed?: boolean; progress?: number })[]> => {
  const { data, error } = await supabase
    .from('exercises')
    .select(`
      *,
      user_progress!left(
        completed,
        progress_percentage
      )
    `)
    .eq('user_progress.user_id', userId)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch exercises with progress: ${error.message}`)
  }

  return data?.map(exercise => ({
    ...exercise,
    completed: exercise.user_progress?.[0]?.completed || false,
    progress: exercise.user_progress?.[0]?.progress_percentage || 0
  })) || []
}

// Get exercises by chapter with user progress
export const getExercisesByChapterWithProgress = async (chapterId: string, userId: string): Promise<(Exercise & { completed?: boolean; progress?: number })[]> => {
  const { data, error } = await supabase
    .from('exercises')
    .select(`
      *,
      user_progress!left(
        completed,
        progress_percentage
      )
    `)
    .eq('chapter_id', chapterId)
    .eq('user_progress.user_id', userId)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch exercises with progress: ${error.message}`)
  }

  return data?.map(exercise => ({
    ...exercise,
    completed: exercise.user_progress?.[0]?.completed || false,
    progress: exercise.user_progress?.[0]?.progress_percentage || 0
  })) || []
}

// Create new exercise (for admin)
export const createExercise = async (exerciseData: Omit<Exercise, 'id' | 'created_at' | 'updated_at'>): Promise<Exercise> => {
  const { data, error } = await supabase
    .from('exercises')
    .insert(exerciseData)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create exercise: ${error.message}`)
  }

  return data
}

// Update exercise (for admin)
export const updateExercise = async (id: string, exerciseData: Partial<Omit<Exercise, 'id' | 'created_at' | 'updated_at'>>): Promise<Exercise> => {
  const { data, error } = await supabase
    .from('exercises')
    .update(exerciseData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update exercise: ${error.message}`)
  }

  return data
}

// Delete exercise (for admin)
export const deleteExercise = async (id: string): Promise<void> => {
  try {
    // First delete associated files from storage
    await deleteExerciseFiles(id)
    
    // Then delete the exercise record from database
    const { error } = await supabase
      .from('exercises')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete exercise: ${error.message}`)
    }
  } catch (error) {
    console.error('Error deleting exercise and files:', error)
    throw error
  }
}

// ===== User Progress Functions =====

// Update user progress for an exercise
export const updateUserProgress = async (
  userId: string,
  exerciseId: string,
  chapterId: string,
  progressData: {
    completed?: boolean
    progress_percentage?: number
    completion_date?: string
  }
): Promise<UserProgress> => {
  const { data, error } = await supabase
    .from('user_progress')
    .upsert({
      user_id: userId,
      exercise_id: exerciseId,
      chapter_id: chapterId,
      ...progressData
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update user progress: ${error.message}`)
  }

  return data
}

// Mark exercise as completed
export const markExerciseCompleted = async (
  userId: string,
  exerciseId: string,
  chapterId: string
): Promise<UserProgress> => {
  return updateUserProgress(userId, exerciseId, chapterId, {
    completed: true,
    progress_percentage: 100,
    completion_date: new Date().toISOString()
  })
}

// Get user progress for a specific exercise
export const getUserProgressForExercise = async (userId: string, exerciseId: string): Promise<UserProgress | null> => {
  const { data, error } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('exercise_id', exerciseId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned - this is ok, user hasn't started this exercise
      return null
    }
    throw new Error(`Failed to fetch user progress: ${error.message}`)
  }

  return data
}

// Get all user progress for a user
export const getUserProgress = async (userId: string): Promise<UserProgress[]> => {
  const { data, error } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch user progress: ${error.message}`)
  }

  return data || []
}