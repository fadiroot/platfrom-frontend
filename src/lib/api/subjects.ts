import { supabase } from '../supabase'
import type { Tables } from '../supabase'

export type Subject = Tables<'subjects'>
export type SubjectLevel = Tables<'subject_levels'>
export type Level = Tables<'levels'>

// Extended types for subjects with levels
export interface SubjectWithLevels extends Subject {
  levels: Level[]
  level_ids: string[]
}

// Get all subjects with their levels - using the subjects_with_all_levels view
export const getSubjects = async (): Promise<SubjectWithLevels[]> => {
  // Use the subjects_with_all_levels view which already has the data properly formatted
  const { data, error } = await supabase
    .from('subjects_with_all_levels')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch subjects: ${error.message}`)
  }

  // Transform the data to match our interface
  return (data || []).map((subject: any) => ({
    id: subject.id,
    title: subject.title,
    description: subject.description,
    image_url: subject.image_url,
    created_at: subject.created_at,
    updated_at: subject.updated_at,
    level_ids: subject.level_ids || [],
    levels: [] // We'll populate this if needed, but level_ids is sufficient for now
  }))
}

// Get subjects by level ID - using the subjects_with_all_levels view
// This function supports subjects that are shared between multiple levels
export const getSubjectsByLevel = async (levelId: string): Promise<SubjectWithLevels[]> => {
  // Use the subjects_with_all_levels view which already has the data properly formatted
  // This view contains subjects with their level_ids array, allowing subjects to be shared between levels
  const { data, error } = await supabase
    .from('subjects_with_all_levels')
    .select('*')
    .contains('level_ids', [levelId]) // This finds subjects where level_ids array contains the specified levelId
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch subjects for level: ${error.message}`)
  }

  // Transform the data to match our interface
  return (data || []).map((subject: any) => ({
    id: subject.id,
    title: subject.title,
    description: subject.description,
    image_url: subject.image_url,
    created_at: subject.created_at,
    updated_at: subject.updated_at,
    level_ids: subject.level_ids || [],
    levels: [] // We'll populate this if needed, but level_ids is sufficient for now
  }))
}

// Get subjects by level ID with level information (legacy function for backward compatibility)
export const getSubjectsByLevelWithLevel = async (levelId: string): Promise<SubjectWithLevels[]> => {
  return getSubjectsByLevel(levelId)
}

// Get subject by ID with levels
export const getSubjectById = async (id: string): Promise<SubjectWithLevels | null> => {
  const { data, error } = await supabase
    .from('subjects_with_all_levels')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    throw new Error(`Failed to fetch subject: ${error.message}`)
  }

  if (!data) return null

  return {
    id: data.id,
    title: data.title,
    description: data.description,
    image_url: data.image_url,
    created_at: data.created_at,
    updated_at: data.updated_at,
    level_ids: data.level_ids || [],
    levels: [] // We'll populate this if needed, but level_ids is sufficient for now
  }
}

// Get subjects with level information (legacy function for backward compatibility)
export const getSubjectsWithLevel = async (): Promise<SubjectWithLevels[]> => {
  return getSubjects()
}

// Create new subject with levels (for admin)
export const createSubject = async (subjectData: {
  title: string
  description?: string | null
  image_url?: string | null
  level_ids?: string[]
}): Promise<SubjectWithLevels> => {
  const { title, description, image_url, level_ids = [] } = subjectData

  // Create the subject first
  const { data: subject, error: subjectError } = await supabase
    .from('subjects')
    .insert({
      title,
      description,
      image_url
    })
    .select()
    .single()

  if (subjectError) {
    throw new Error(`Failed to create subject: ${subjectError.message}`)
  }

  // Create subject-level relationships if level_ids are provided
  if (level_ids.length > 0) {
    const subjectLevelData = level_ids.map(levelId => ({
      subject_id: subject.id,
      level_id: levelId
    }))

    const { error: levelError } = await supabase
      .from('subject_levels')
      .insert(subjectLevelData)

    if (levelError) {
      // If level assignment fails, clean up the subject
      await supabase.from('subjects').delete().eq('id', subject.id)
      throw new Error(`Failed to assign levels to subject: ${levelError.message}`)
    }
  }

  // Return the subject with its levels
  return getSubjectById(subject.id) as Promise<SubjectWithLevels>
}

// Update subject with levels (for admin)
export const updateSubject = async (id: string, subjectData: {
  title?: string
  description?: string | null
  image_url?: string | null
  level_ids?: string[]
}): Promise<SubjectWithLevels> => {
  const { title, description, image_url, level_ids } = subjectData

  // Update the subject basic info
  const updateData: any = {}
  if (title !== undefined) updateData.title = title
  if (description !== undefined) updateData.description = description
  if (image_url !== undefined) updateData.image_url = image_url

  if (Object.keys(updateData).length > 0) {
    const { error: subjectError } = await supabase
      .from('subjects')
      .update(updateData)
      .eq('id', id)

    if (subjectError) {
      throw new Error(`Failed to update subject: ${subjectError.message}`)
    }
  }

  // Update level assignments if provided
  if (level_ids !== undefined) {
    // First, remove all existing level assignments
    const { error: deleteError } = await supabase
      .from('subject_levels')
      .delete()
      .eq('subject_id', id)

    if (deleteError) {
      throw new Error(`Failed to remove existing level assignments: ${deleteError.message}`)
    }

    // Then, add new level assignments
    if (level_ids.length > 0) {
      const subjectLevelData = level_ids.map(levelId => ({
        subject_id: id,
        level_id: levelId
      }))

      const { error: levelError } = await supabase
        .from('subject_levels')
        .insert(subjectLevelData)

      if (levelError) {
        throw new Error(`Failed to assign levels to subject: ${levelError.message}`)
      }
    }
  }

  // Return the updated subject with its levels
  return getSubjectById(id) as Promise<SubjectWithLevels>
}

// Delete subject (for admin)
export const deleteSubject = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('subjects')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(`Failed to delete subject: ${error.message}`)
  }
}

// Add level to subject
export const addLevelToSubject = async (subjectId: string, levelId: string): Promise<void> => {
  const { error } = await supabase
    .from('subject_levels')
    .insert({
      subject_id: subjectId,
      level_id: levelId
    })

  if (error) {
    throw new Error(`Failed to add level to subject: ${error.message}`)
  }
}

// Remove level from subject
export const removeLevelFromSubject = async (subjectId: string, levelId: string): Promise<void> => {
  const { error } = await supabase
    .from('subject_levels')
    .delete()
    .eq('subject_id', subjectId)
    .eq('level_id', levelId)

  if (error) {
    throw new Error(`Failed to remove level from subject: ${error.message}`)
  }
}