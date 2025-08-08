import React, { useEffect, useState, useRef } from 'react'
import { getExercises, createExercise, updateExercise, deleteExercise } from '@/lib/api/exercises'
import { getChapters } from '@/lib/api/chapters'
import { uploadExercisePDF } from '@/lib/api/storage'
import type { Tables } from '@/lib/supabase'
import CustomSelect from '../../shared/components/CustomSelect/CustomSelect'
import './ExerciseManagement.scss'

// Add some inline styles for the upload info (you can move this to SCSS later)
const uploadInfoStyle: React.CSSProperties = {
  backgroundColor: '#f0f9ff',
  border: '1px solid #0ea5e9',
  borderRadius: '6px',
  padding: '8px 12px',
  marginBottom: '12px',
  fontSize: '12px',
  color: '#0c4a6e'
}

type Exercise = Tables<'exercises'>
type Chapter = Tables<'chapters'>

interface ExerciseFormData {
  name: string
  difficulty: 'Easy' | 'Medium' | 'Hard' | null
  chapter_id: string | null
  tag: number | null
  exercise_file_urls: string[]
  correction_file_urls: string[]
}

const ExerciseManagement: React.FC = () => {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null)
  const [formData, setFormData] = useState<ExerciseFormData>({
    name: '',
    difficulty: null,
    chapter_id: null,
    tag: null,
    exercise_file_urls: [],
    correction_file_urls: []
  })
  const [submitting, setSubmitting] = useState(false)
  const [uploadingFiles, setUploadingFiles] = useState(false)
  
  // Ref to track if component is mounted
  const isMountedRef = useRef(true)

  // Initial data fetch on component mount
  useEffect(() => {
    fetchData()
    
    // Cleanup function to handle component unmounting
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Handle modal navigation cleanup and body class management
  useEffect(() => {
    // Handle navigation away from page with open modal
    const handleBeforeUnload = () => {
      if (showForm) {
        // Close modal before navigation
        setShowForm(false)
      }
    }

    // Manage body class for modal state
    if (showForm) {
      document.body.classList.add('modal-open')
    } else {
      document.body.classList.remove('modal-open')
    }

    // Add event listener for page navigation
    window.addEventListener('beforeunload', handleBeforeUnload)
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.body.classList.remove('modal-open')
    }
  }, [showForm])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [exercisesData, chaptersData] = await Promise.all([
        getExercises(),
        getChapters()
      ])
      setExercises(exercisesData)
      setChapters(chaptersData)
    } catch (error) {
      console.error('Error fetching data:', error)
      alert('Erreur lors du chargement des données')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (files: FileList, type: 'problem' | 'correction') => {
    if (!files.length) return

    // Validate file types
    const fileArray = Array.from(files)
    const invalidFiles = fileArray.filter(file => !file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf'))
    
    if (invalidFiles.length > 0) {
      alert(`Seuls les fichiers PDF sont autorisés. Fichiers invalides: ${invalidFiles.map(f => f.name).join(', ')}`)
      return
    }

    // Check file sizes (50MB max per file)
    const oversizedFiles = fileArray.filter(file => file.size > 50 * 1024 * 1024)
    if (oversizedFiles.length > 0) {
      alert(`Fichiers trop volumineux (max 50MB): ${oversizedFiles.map(f => f.name).join(', ')}`)
      return
    }

    const exerciseId = editingExercise?.id || `temp_${Date.now()}`
    
    try {
      setUploadingFiles(true)
      console.log(`📤 Uploading ${files.length} file(s) to ${type === 'problem' ? 'exercise-files' : 'correction-files'} bucket...`)
      
      const uploadPromises = fileArray.map((file, index) => {
        console.log(`📄 Uploading file ${index + 1}/${files.length}: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`)
        return uploadExercisePDF(exerciseId, file, type)
      })
      
      const results = await Promise.all(uploadPromises)
      const urls = results.map(result => result.url)

      console.log(`✅ Successfully uploaded ${results.length} file(s)`)
      console.log('📊 Upload results:', results)

      setFormData(prev => ({
        ...prev,
        [type === 'problem' ? 'exercise_file_urls' : 'correction_file_urls']: [
          ...prev[type === 'problem' ? 'exercise_file_urls' : 'correction_file_urls'],
          ...urls
        ]
      }))

      const bucketName = type === 'problem' ? 'exercise-files' : 'correction-files'
      alert(`✅ ${files.length} fichier(s) téléchargé(s) avec succès dans le bucket "${bucketName}"!`)
    } catch (error) {
      console.error('❌ Error uploading files:', error)
      alert(`❌ Erreur lors du téléchargement: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    } finally {
      setUploadingFiles(false)
    }
  }

  const removeFile = (url: string, type: 'exercise' | 'correction') => {
    const fieldName = type === 'exercise' ? 'exercise_file_urls' : 'correction_file_urls'
    setFormData(prev => ({
      ...prev,
      [fieldName]: prev[fieldName].filter(fileUrl => fileUrl !== url)
    }))
    
    // Note: We're only removing from the form, not deleting from storage
    // Files will be cleaned up when the exercise is deleted
    console.log(`📝 Removed file from form: ${url.split('/').pop()}`)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      alert('Le nom est obligatoire')
      return
    }

    try {
      setSubmitting(true)
      
      if (editingExercise) {
        await updateExercise(editingExercise.id, formData)
        alert('Exercice mis à jour avec succès!')
      } else {
        await createExercise(formData)
        alert('Exercice créé avec succès!')
      }

      await fetchData()
      resetForm()
    } catch (error) {
      console.error('Error saving exercise:', error)
      alert('Erreur lors de la sauvegarde')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (exercise: Exercise) => {
    setEditingExercise(exercise)
    setFormData({
      name: exercise.name,
      difficulty: exercise.difficulty,
      chapter_id: exercise.chapter_id,
      tag: exercise.tag,
      exercise_file_urls: exercise.exercise_file_urls || [],
      correction_file_urls: exercise.correction_file_urls || []
    })
    setShowForm(true)
  }

  const handleDelete = async (exercise: Exercise) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'exercice "${exercise.name}" ?`)) {
      return
    }

    try {
      await deleteExercise(exercise.id)
      alert('Exercice supprimé avec succès!')
      await fetchData()
    } catch (error) {
      console.error('Error deleting exercise:', error)
      alert('Erreur lors de la suppression')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      difficulty: null,
      chapter_id: null,
      tag: null,
      exercise_file_urls: [],
      correction_file_urls: []
    })
    setEditingExercise(null)
    setShowForm(false)
  }

  const getChapterName = (chapterId: string | null) => {
    if (!chapterId) return 'Aucun chapitre'
    const chapter = chapters.find(c => c.id === chapterId)
    return chapter ? chapter.title : 'Chapitre inconnu'
  }

  const getDifficultyColor = (difficulty: string | null) => {
    switch (difficulty) {
      case 'Easy': return 'green'
      case 'Medium': return 'orange'
      case 'Hard': return 'red'
      default: return 'gray'
    }
  }

  if (loading) {
    return (
      <div className="exercise-management">
        <div className="loading">Chargement des exercices...</div>
      </div>
    )
  }

  return (
    <div className="exercise-management">
      <div className="management-header">
        <h1>✏️ Gestion des Exercices</h1>
        <button 
          className="btn-primary"
          onClick={() => setShowForm(true)}
        >
          ➕ Nouvel Exercice
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => resetForm()}>
          <div className="modal-content large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingExercise ? '✏️ Modifier l\'Exercice' : '➕ Nouvel Exercice'}</h2>
              <button className="close-btn" onClick={resetForm}>✕</button>
            </div>

            <form onSubmit={handleSubmit} className="exercise-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">Nom de l'exercice *</label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Algorithme de Tri à Bulles"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="tag">Tag (numéro)</label>
                  <input
                    type="number"
                    id="tag"
                    value={formData.tag || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, tag: e.target.value ? parseInt(e.target.value) : null }))}
                    placeholder="1, 2, 3..."
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="chapter_id">Chapitre *</label>
                  <CustomSelect
                  options={[
                    { value: '', label: 'Sélectionner un chapitre' },
                    ...chapters.map(chapter => ({
                      value: chapter.id,
                      label: chapter.title
                    }))
                  ]}
                  value={formData.chapter_id || ''}
                  onChange={(value: string) => setFormData(prev => ({ ...prev, chapter_id: value || null }))}
                  onBlur={() => {}}
                  placeholder="Sélectionner un chapitre"
                />
                </div>

                <div className="form-group">
                  <label htmlFor="difficulty">Difficulté</label>
                  <CustomSelect
                  options={[
                    { value: '', label: 'Sélectionner la difficulté' },
                    { value: 'Easy', label: 'Facile' },
                    { value: 'Medium', label: 'Moyen' },
                    { value: 'Hard', label: 'Difficile' }
                  ]}
                  value={formData.difficulty || ''}
                  onChange={(value: string) => setFormData(prev => ({ ...prev, difficulty: (value as 'Easy' | 'Medium' | 'Hard') || null }))}
                  onBlur={() => {}}
                  placeholder="Sélectionner la difficulté"
                />
                </div>
              </div>

              {/* File Upload Sections */}
              <div className="file-sections">
                <div className="file-section">
                  <h3>📄 Fichiers d'exercice (PDF)</h3>
                  <div className="upload-info" style={uploadInfoStyle}>
                    <small>📁 Bucket: <code>exercise-files</code> | 📂 Dossier: <code>{editingExercise?.id || 'new-exercise'}/</code></small>
                  </div>
                  <input
                    type="file"
                    multiple
                    accept=".pdf"
                    onChange={(e) => e.target.files && handleFileUpload(e.target.files, 'problem')}
                    disabled={uploadingFiles}
                  />
                  {uploadingFiles && <p className="uploading">📤 Téléchargement vers les buckets...</p>}
                  
                  <div className="file-list">
                    {formData.exercise_file_urls.map((url, index) => (
                      <div key={index} className="file-item">
                        <span>📄 {url.split('/').pop()}</span>
                        <button
                          type="button"
                          onClick={() => removeFile(url, 'exercise')}
                          className="remove-file"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="file-section">
                  <h3>✅ Fichiers de correction (PDF)</h3>
                  <div className="upload-info" style={uploadInfoStyle}>
                    <small>📁 Bucket: <code>correction-files</code> | 📂 Dossier: <code>{editingExercise?.id || 'new-exercise'}/</code></small>
                  </div>
                  <input
                    type="file"
                    multiple
                    accept=".pdf"
                    onChange={(e) => e.target.files && handleFileUpload(e.target.files, 'correction')}
                    disabled={uploadingFiles}
                  />
                  {uploadingFiles && <p className="uploading">📤 Téléchargement vers les buckets...</p>}
                  
                  <div className="file-list">
                    {formData.correction_file_urls.map((url, index) => (
                      <div key={index} className="file-item">
                        <span>✅ {url.split('/').pop()}</span>
                        <button
                          type="button"
                          onClick={() => removeFile(url, 'correction')}
                          className="remove-file"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" onClick={resetForm} className="btn-secondary">
                  Annuler
                </button>
                <button type="submit" disabled={submitting || uploadingFiles} className="btn-primary">
                  {submitting ? 'Sauvegarde...' : (editingExercise ? 'Mettre à jour' : 'Créer')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Exercises List */}
      <div className="exercises-grid">
        {exercises.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">✏️</div>
            <h3>Aucun exercice trouvé</h3>
            <p>Commencez par créer votre premier exercice</p>
            <button className="btn-primary" onClick={() => setShowForm(true)}>
              Créer un exercice
            </button>
          </div>
        ) : (
          exercises.map(exercise => (
            <div key={exercise.id} className="exercise-card">
              <div className="card-header">
                <h3>{exercise.name}</h3>
                <div className="card-actions">
                  <button 
                    onClick={() => handleEdit(exercise)}
                    className="btn-edit"
                    title="Modifier"
                  >
                    ✏️
                  </button>
                  <button 
                    onClick={() => handleDelete(exercise)}
                    className="btn-delete"
                    title="Supprimer"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <div className="card-content">
                <div className="card-meta">
                  <span className="chapter-badge">
                    📖 {getChapterName(exercise.chapter_id)}
                  </span>
                  {exercise.difficulty && (
                    <span className={`difficulty-badge ${getDifficultyColor(exercise.difficulty)}`}>
                      {exercise.difficulty === 'Easy' ? 'Facile' : 
                       exercise.difficulty === 'Medium' ? 'Moyen' : 'Difficile'}
                    </span>
                  )}
                  {exercise.tag && (
                    <span className="tag-badge">
                      #{exercise.tag}
                    </span>
                  )}
                </div>

                <div className="files-info">
                  <div className="file-count">
                    📄 {(exercise.exercise_file_urls || []).length} fichier(s) d'exercice
                  </div>
                  <div className="file-count">
                    ✅ {(exercise.correction_file_urls || []).length} fichier(s) de correction
                  </div>
                </div>

                <div className="date-info">
                  Créé le {new Date(exercise.created_at).toLocaleDateString('fr-FR')}
                </div>
              </div>

              <div className="card-footer">
                <span className="exercise-id">ID: {exercise.id.slice(0, 8)}...</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default ExerciseManagement