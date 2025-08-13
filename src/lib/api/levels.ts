import { supabase } from '../supabase'
import type { Tables } from '../supabase'

export type Level = Tables<'levels'>

// Get all levels (for authenticated users)
export const getLevels = async (): Promise<Level[]> => {
  const { data, error } = await supabase
    .from('levels')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch levels: ${error.message}`)
  }

  return data || []
}

// Get all levels for public access (for signup process)
export const getPublicLevels = async (): Promise<Level[]> => {
  const { data, error } = await supabase
    .from('levels')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching public levels:', error)
    // Return empty array instead of throwing error for better UX
    return []
  }

  return data || []
}

// Get level by ID
export const getLevelById = async (id: string): Promise<Level | null> => {
  const { data, error } = await supabase
    .from('levels')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    throw new Error(`Failed to fetch level: ${error.message}`)
  }

  return data
}

// Create new level (for admin)
export const createLevel = async (levelData: Omit<Level, 'id' | 'created_at' | 'updated_at'>): Promise<Level> => {
  const { data, error } = await supabase
    .from('levels')
    .insert(levelData)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create level: ${error.message}`)
  }

  return data
}

// Update level (for admin)
export const updateLevel = async (id: string, levelData: Partial<Omit<Level, 'id' | 'created_at' | 'updated_at'>>): Promise<Level> => {
  const { data, error } = await supabase
    .from('levels')
    .update(levelData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update level: ${error.message}`)
  }

  return data
}

// Delete level (for admin)
export const deleteLevel = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('levels')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(`Failed to delete level: ${error.message}`)
  }
}