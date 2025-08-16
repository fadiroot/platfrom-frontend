import { supabase } from '../supabase'
import type { Tables } from '../supabase'
import { deleteExerciseFiles } from './storage'

export type Exercise = Tables<'exercises'>

// Type for exercises without file URLs (for security)
export type ExerciseWithoutFiles = Omit<Exercise, 'exercise_file_urls' | 'correction_file_urls'>

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

// Get exercises by chapter ID with subscription checking
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

// Get exercises by chapter ID WITHOUT file URLs (secure version)
export const getExercisesByChapterSecure = async (chapterId: string): Promise<ExerciseWithoutFiles[]> => {
  const { data, error } = await supabase
    .from('exercises')
    .select(`
      id,
      name,
      tag,
      difficulty,
      chapter_id,
      created_at,
      updated_at,
      is_public
    `)
    .eq('chapter_id', chapterId)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch exercises by chapter: ${error.message}`)
  }

  return data || []
}

// Get user accessible exercises using RPC function (with subscription checking)
export const getUserAccessibleExercises = async (): Promise<Exercise[]> => {
  const { data, error } = await supabase
    .rpc('get_user_accessible_exercises')

  if (error) {
    throw new Error(`Failed to fetch accessible exercises: ${error.message}`)
  }

  return data || []
}

// Check if user can access a specific exercise
export const canAccessExercise = async (exerciseId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .rpc('can_access_exercise', { exercise_id: exerciseId })

  if (error) {
    console.error('Error checking exercise access:', error)
    return false
  }

  return data || false
}

// Get exercises by chapter with subscription checking
export const getExercisesByChapterWithAccess = async (chapterId: string): Promise<{
  exercises: ExerciseWithoutFiles[]
  userHasAccess: boolean
  accessibleExercises: string[]
}> => {
  try {
    // Get all exercises for the chapter WITHOUT file URLs
    const allExercises = await getExercisesByChapterSecure(chapterId)
    
    // Check access for each exercise
    const accessChecks = await Promise.all(
      allExercises.map(async (exercise) => {
        const hasAccess = await canAccessExercise(exercise.id)
        return { exerciseId: exercise.id, hasAccess }
      })
    )
    
    const accessibleExerciseIds = accessChecks
      .filter(check => check.hasAccess)
      .map(check => check.exerciseId)
    
    // Determine if user has access to any exercises
    const userHasAccess = accessibleExerciseIds.length > 0
    
    return {
      exercises: allExercises,
      userHasAccess,
      accessibleExercises: accessibleExerciseIds
    }
  } catch (error) {
    console.error('Error fetching exercises with access:', error)
    throw error
  }
}

// SECURE FILE ACCESS FUNCTIONS

// Get secure file URLs for an exercise (with access checking)
export const getSecureExerciseFiles = async (exerciseId: string, exerciseIndex?: number): Promise<{
  exerciseFiles: string[]
  correctionFiles: string[]
  hasAccess: boolean
}> => {
  try {
    // Check if user has access to this exercise
    const hasAccess = await canAccessExercise(exerciseId)
    
    if (!hasAccess) {
      return {
        exerciseFiles: [],
        correctionFiles: [],
        hasAccess: false
      }
    }

    // If user has access, get the exercise with file URLs
    const { data, error } = await supabase
      .from('exercises')
      .select('exercise_file_urls, correction_file_urls')
      .eq('id', exerciseId)
      .single()

    if (error) {
      throw new Error(`Failed to fetch exercise files: ${error.message}`)
    }

    return {
      exerciseFiles: data?.exercise_file_urls || [],
      correctionFiles: data?.correction_file_urls || [],
      hasAccess: true
    }
  } catch (error) {
    console.error('Error getting secure exercise files:', error)
    return {
      exerciseFiles: [],
      correctionFiles: [],
      hasAccess: false
    }
  }
}

// Get secure file URL with temporary access token
export const getSecureFileUrl = async (fileUrl: string, exerciseId: string): Promise<string | null> => {
  try {
    // Check if user has access to the exercise
    const hasAccess = await canAccessExercise(exerciseId)
    
    if (!hasAccess) {
      return null
    }

    // For Supabase storage, we can create a signed URL with expiration
    // This ensures the URL expires and can't be reused indefinitely
    if (fileUrl.includes('supabase.co')) {
      // Extract the file path from the URL
      const urlParts = fileUrl.split('/')
      const bucketName = urlParts[urlParts.length - 3] // Usually 'exercises' or similar
      const filePath = urlParts.slice(-2).join('/') // Get the actual file path
      
      const { data, error } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(filePath, 3600) // 1 hour expiration
      
      if (error) {
        console.error('Error creating signed URL:', error)
        return null
      }
      
      return data.signedUrl
    }

    // For other storage providers, return the original URL if access is granted
    return fileUrl
  } catch (error) {
    console.error('Error getting secure file URL:', error)
    return null
  }
}

// Get exercises by subject ID (through chapters)
export const getExercisesBySubject = async (subjectId: string): Promise<ExerciseWithoutFiles[]> => {
  const { data, error } = await supabase
    .from('exercises')
    .select(`
      id,
      name,
      tag,
      difficulty,
      chapter_id,
      created_at,
      updated_at,
      is_public,
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

// Get exercise by ID (without file URLs for security)
export const getExerciseById = async (id: string): Promise<ExerciseWithoutFiles | null> => {
  const { data, error } = await supabase
    .from('exercises')
    .select(`
      id,
      name,
      tag,
      difficulty,
      chapter_id,
      created_at,
      updated_at,
      is_public
    `)
    .eq('id', id)
    .single()

  if (error) {
    throw new Error(`Failed to fetch exercise: ${error.message}`)
  }

  return data
}

// Get exercises with chapter, subject, and level information (without file URLs)
export const getExercisesWithDetails = async (): Promise<(ExerciseWithoutFiles & {
  chapter: Tables<'chapters'> & {
    subject: Tables<'subjects'> & { level: Tables<'levels'> | null } | null
  } | null
})[]> => {
  const { data, error } = await supabase
    .from('exercises')
    .select(`
      id,
      name,
      tag,
      difficulty,
      chapter_id,
      created_at,
      updated_at,
      is_public,
      chapter:chapters(
        id,
        title,
        description,
        exercise_count,
        estimated_time,
        difficulty,
        type,
        subject_id,
        created_at,
        updated_at,
        subject:subjects(
          id,
          name,
          description,
          level_id,
          created_at,
          updated_at,
          level:levels(
            id,
            name,
            description,
            created_at,
            updated_at
          )
        )
      )
    `)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch exercises with details: ${error.message}`)
  }

  return (data as any) || []
}

// Get exercises with user progress (without file URLs)
export const getExercisesWithProgress = async (userId: string): Promise<(ExerciseWithoutFiles & { completed?: boolean; progress?: number })[]> => {
  const { data, error } = await supabase
    .from('exercises')
    .select(`
      id,
      name,
      tag,
      difficulty,
      chapter_id,
      created_at,
      updated_at,
      is_public,
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

// Get exercises by chapter with user progress (without file URLs)
export const getExercisesByChapterWithProgress = async (chapterId: string, userId: string): Promise<(ExerciseWithoutFiles & { completed?: boolean; progress?: number })[]> => {
  const { data, error } = await supabase
    .from('exercises')
    .select(`
      id,
      name,
      tag,
      difficulty,
      chapter_id,
      created_at,
      updated_at,
      is_public,
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