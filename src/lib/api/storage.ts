import { supabase } from '../supabase'

// Storage bucket names
export const STORAGE_BUCKETS = {
  EXERCISE_FILES: 'exercise-files', // Bucket for exercise/problem files
  CORRECTION_FILES: 'correction-files', // Bucket for correction/solution files
  AVATARS: 'avatars',
  SUBJECT_IMAGES: 'subject-images'
} as const

export type StorageBucket = typeof STORAGE_BUCKETS[keyof typeof STORAGE_BUCKETS]

// File upload with progress tracking
export interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}

export interface UploadOptions {
  onProgress?: (progress: UploadProgress) => void
  cacheControl?: string
  contentType?: string
  upsert?: boolean
}

// Upload file to storage
export const uploadFile = async (
  bucket: StorageBucket,
  path: string,
  file: File,
  options: UploadOptions = {}
): Promise<{ path: string; url: string }> => {
  const { onProgress, cacheControl = '3600', contentType, upsert = false } = options

  // Create a unique filename if needed
  const timestamp = Date.now()
  const extension = file.name.split('.').pop()
  const uniquePath = path.includes('.') ? path : `${path}_${timestamp}.${extension}`

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(uniquePath, file, {
      cacheControl,
      contentType: contentType || file.type,
      upsert
    })

  if (error) {
    throw new Error(`Failed to upload file: ${error.message}`)
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path)

  return {
    path: data.path,
    url: urlData.publicUrl
  }
}

// Upload multiple files
export const uploadMultipleFiles = async (
  bucket: StorageBucket,
  files: { file: File; path: string }[],
  options: UploadOptions = {}
): Promise<{ path: string; url: string }[]> => {
  const uploadPromises = files.map(({ file, path }) => 
    uploadFile(bucket, path, file, options)
  )

  return Promise.all(uploadPromises)
}

// Delete file from storage
export const deleteFile = async (
  bucket: StorageBucket,
  path: string
): Promise<void> => {
  const { error } = await supabase.storage
    .from(bucket)
    .remove([path])

  if (error) {
    throw new Error(`Failed to delete file: ${error.message}`)
  }
}

// Delete multiple files
export const deleteMultipleFiles = async (
  bucket: StorageBucket,
  paths: string[]
): Promise<void> => {
  const { error } = await supabase.storage
    .from(bucket)
    .remove(paths)

  if (error) {
    throw new Error(`Failed to delete files: ${error.message}`)
  }
}

// Get file URL
export const getFileUrl = (bucket: StorageBucket, path: string): string => {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path)

  return data.publicUrl
}

// Get signed URL (for private files)
export const getSignedUrl = async (
  bucket: StorageBucket,
  path: string,
  expiresIn: number = 3600 // 1 hour default
): Promise<string> => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn)

  if (error) {
    throw new Error(`Failed to create signed URL: ${error.message}`)
  }

  return data.signedUrl
}

// List files in a folder
export const listFiles = async (
  bucket: StorageBucket,
  folder: string = '',
  options: {
    limit?: number
    offset?: number
    sortBy?: { column: string; order: 'asc' | 'desc' }
  } = {}
) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .list(folder, {
      limit: options.limit,
      offset: options.offset,
      sortBy: options.sortBy
    })

  if (error) {
    throw new Error(`Failed to list files: ${error.message}`)
  }

  return data
}

// Get file metadata
export const getFileMetadata = async (
  bucket: StorageBucket,
  path: string
) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .list('', {
      search: path
    })

  if (error) {
    throw new Error(`Failed to get file metadata: ${error.message}`)
  }

  return data.find(file => file.name === path.split('/').pop())
}

// Helper functions for specific file types

// Upload exercise PDF (problems and corrections go to separate buckets)
export const uploadExercisePDF = async (
  exerciseId: string,
  file: File,
  type: 'problem' | 'correction',
  options: UploadOptions = {}
): Promise<{ path: string; url: string }> => {
  // Use separate buckets for problems and corrections
  const bucket = type === 'problem' ? STORAGE_BUCKETS.EXERCISE_FILES : STORAGE_BUCKETS.CORRECTION_FILES
  const timestamp = Date.now()
  const extension = file.name.split('.').pop() || 'pdf'
  const originalName = file.name.replace(/\.[^/.]+$/, '') // Remove extension
  const safeName = originalName.replace(/[^a-zA-Z0-9-_]/g, '_') // Make filename safe
  
  // Organize files by exercise ID: {exerciseId}/{filename}
  const path = `${exerciseId}/${safeName}_${timestamp}.${extension}`
  
  return uploadFile(bucket, path, file, {
    ...options,
    contentType: file.type || 'application/pdf'
  })
}

// Upload subject image
export const uploadSubjectImage = async (
  subjectId: string,
  file: File,
  options: UploadOptions = {}
): Promise<{ path: string; url: string }> => {
  const path = `${subjectId}/image_${Date.now()}`
  
  return uploadFile(STORAGE_BUCKETS.SUBJECT_IMAGES, path, file, options)
}

// Upload user avatar
export const uploadUserAvatar = async (
  userId: string,
  file: File,
  options: UploadOptions = {}
): Promise<{ path: string; url: string }> => {
  const path = `${userId}/avatar_${Date.now()}`
  
  return uploadFile(STORAGE_BUCKETS.AVATARS, path, file, options)
}

// Delete exercise files (for cleanup when deleting exercises)
export const deleteExerciseFiles = async (
  exerciseId: string,
  type?: 'problem' | 'correction'
): Promise<void> => {
  if (type) {
    // Delete specific type of files from the appropriate bucket
    const bucket = type === 'problem' ? STORAGE_BUCKETS.EXERCISE_FILES : STORAGE_BUCKETS.CORRECTION_FILES
    
    const { data: files, error: listError } = await supabase.storage
      .from(bucket)
      .list(exerciseId)
    
    if (listError) {
      console.error(`Error listing ${type} files for deletion:`, listError)
      return
    }
    
    if (files && files.length > 0) {
      const filePaths = files.map(file => `${exerciseId}/${file.name}`)
      await deleteMultipleFiles(bucket, filePaths)
    }
  } else {
    // Delete all files for this exercise from both buckets
    const buckets = [
      { bucket: STORAGE_BUCKETS.EXERCISE_FILES, type: 'exercise' },
      { bucket: STORAGE_BUCKETS.CORRECTION_FILES, type: 'correction' }
    ]
    
    for (const { bucket, type: bucketType } of buckets) {
      const { data: files, error: listError } = await supabase.storage
        .from(bucket)
        .list(exerciseId)
      
      if (listError) {
        console.error(`Error listing ${bucketType} files for deletion:`, listError)
        continue
      }
      
      if (files && files.length > 0) {
        const filePaths = files.map(file => `${exerciseId}/${file.name}`)
        await deleteMultipleFiles(bucket, filePaths)
      }
    }
  }
}

// List exercise files
export const listExerciseFiles = async (
  exerciseId: string,
  type?: 'problem' | 'correction'
) => {
  if (type) {
    const bucket = type === 'problem' ? STORAGE_BUCKETS.EXERCISE_FILES : STORAGE_BUCKETS.CORRECTION_FILES
    return listFiles(bucket, exerciseId)
  } else {
    // List all files for this exercise from both buckets
    const [exerciseFiles, correctionFiles] = await Promise.all([
      listFiles(STORAGE_BUCKETS.EXERCISE_FILES, exerciseId),
      listFiles(STORAGE_BUCKETS.CORRECTION_FILES, exerciseId)
    ])
    
    return {
      exercise: exerciseFiles,
      correction: correctionFiles
    }
  }
}

// Setup storage buckets (run this once in your Supabase project)
export const setupStorageBuckets = async () => {
  const buckets = Object.values(STORAGE_BUCKETS)
  
  for (const bucket of buckets) {
    const { data, error } = await supabase.storage.createBucket(bucket, {
      public: true, // Make files publicly accessible
      allowedMimeTypes: bucket === STORAGE_BUCKETS.EXERCISE_FILES || bucket === STORAGE_BUCKETS.CORRECTION_FILES
        ? ['application/pdf', 'image/*'] // Allow both PDFs and images for exercise files
        : ['image/*'],
      fileSizeLimit: 1024 * 1024 * 50 // 50MB limit
    })

    if (error && !error.message.includes('already exists')) {
      console.error(`Failed to create bucket ${bucket}:`, error)
    } else {
      console.log(`Bucket ${bucket} ready`)
    }
  }
}