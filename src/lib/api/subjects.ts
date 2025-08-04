import { supabase } from '../supabase'
import type { Tables } from '../supabase'

export type Subject = Tables<'subjects'>

// Get all subjects
export const getSubjects = async (): Promise<Subject[]> => {
  const { data, error } = await supabase
    .from('subjects')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch subjects: ${error.message}`)
  }

  return data || []
}

// Get subjects by level ID
export const getSubjectsByLevel = async (levelId: string): Promise<Subject[]> => {
  const { data, error } = await supabase
    .from('subjects')
    .select('*')
    .eq('level_id', levelId)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch subjects by level: ${error.message}`)
  }

  return data || []
}

// Get subject by ID
export const getSubjectById = async (id: string): Promise<Subject | null> => {
  const { data, error } = await supabase
    .from('subjects')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    throw new Error(`Failed to fetch subject: ${error.message}`)
  }

  return data
}

// Get subjects with level information
export const getSubjectsWithLevel = async (): Promise<(Subject & { level: Tables<'levels'> | null })[]> => {
  const { data, error } = await supabase
    .from('subjects')
    .select(`
      *,
      level:levels(*)
    `)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch subjects with levels: ${error.message}`)
  }

  return data || []
}

// Create new subject (for admin)
export const createSubject = async (subjectData: Omit<Subject, 'id' | 'created_at' | 'updated_at'>): Promise<Subject> => {
  const { data, error } = await supabase
    .from('subjects')
    .insert(subjectData)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create subject: ${error.message}`)
  }

  return data
}

// Update subject (for admin)
export const updateSubject = async (id: string, subjectData: Partial<Omit<Subject, 'id' | 'created_at' | 'updated_at'>>): Promise<Subject> => {
  const { data, error } = await supabase
    .from('subjects')
    .update(subjectData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update subject: ${error.message}`)
  }

  return data
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