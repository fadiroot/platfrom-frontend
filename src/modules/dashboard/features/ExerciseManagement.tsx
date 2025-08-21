import React, { useEffect, useState, useRef } from 'react'
import { getExercises, createExercise, updateExercise, deleteExercise } from '@/lib/api/exercises'
import { getChapters } from '@/lib/api/chapters'
import { getSubjects } from '@/lib/api/subjects'
import { getLevels } from '@/lib/api/levels'
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
type Subject = Tables<'subjects'>
type Level = Tables<'levels'>

interface ExerciseFormData {
  name: string
  difficulty: 'Easy' | 'Medium' | 'Hard' | null
  level_id: string | null
  subject_id: string | null
  chapter_id: string | null
  exercise_file_urls: string[]
  correction_file_urls: string[]
  is_public: boolean
}

const ExerciseManagement: React.FC = () => {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [levels, setLevels] = useState<Level[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null)
  const [formData, setFormData] = useState<ExerciseFormData>({
    name: '',
    difficulty: null,
    level_id: null,
    subject_id: null,
    chapter_id: null,
    exercise_file_urls: [],
    correction_file_urls: [],
    is_public: false
  })
  const [submitting, setSubmitting] = useState(false)
  const [uploadingFiles, setUploadingFiles] = useState(false)
  
  // Filter state
  const [filters, setFilters] = useState({
    level_id: '',
    subject_id: '',
    chapter_id: '',
    difficulty: '',
    search: ''
  })
  
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
      const [exercisesData, levelsData, subjectsData, chaptersData] = await Promise.all([
        getExercises(),
        getLevels(),
        getSubjects(),
        getChapters()
      ])
      setExercises(exercisesData)
      setLevels(levelsData)
      setSubjects(subjectsData)
      setChapters(chaptersData)
    } catch (error) {
      console.error('Error fetching data:', error)
      alert('Erreur lors du chargement des données')
    } finally {
      setLoading(false)
    }
  }

  // Filter functions
  const handleFilterLevelChange = (levelId: string) => {
    setFilters(prev => ({
      ...prev,
      level_id: levelId,
      subject_id: '',
      chapter_id: ''
    }))
  }

  const handleFilterSubjectChange = (subjectId: string) => {
    setFilters(prev => ({
      ...prev,
      subject_id: subjectId,
      chapter_id: ''
    }))
  }

  const handleFilterChapterChange = (chapterId: string) => {
    setFilters(prev => ({
      ...prev,
      chapter_id: chapterId
    }))
  }

  const handleFilterDifficultyChange = (difficulty: string) => {
    setFilters(prev => ({
      ...prev,
      difficulty
    }))
  }

  const handleSearchChange = (search: string) => {
    setFilters(prev => ({
      ...prev,
      search
    }))
  }

  const clearFilters = () => {
    setFilters({
      level_id: '',
      subject_id: '',
      chapter_id: '',
      difficulty: '',
      search: ''
    })
  }

  // Get filtered exercises
  const getFilteredExercises = () => {
    return exercises.filter(exercise => {
      // Get chapter and subject info for this exercise
      const chapter = chapters.find(c => c.id === exercise.chapter_id)
      const subject = chapter ? subjects.find(s => s.id === chapter.subject_id) : null
      
      // Level filter
      if (filters.level_id && subject?.level_id !== filters.level_id) {
        return false
      }
      
      // Subject filter
      if (filters.subject_id && chapter?.subject_id !== filters.subject_id) {
        return false
      }
      
      // Chapter filter
      if (filters.chapter_id && exercise.chapter_id !== filters.chapter_id) {
        return false
      }
      
      // Difficulty filter
      if (filters.difficulty && exercise.difficulty !== filters.difficulty) {
        return false
      }
      
      // Search filter
      if (filters.search && !exercise.name.toLowerCase().includes(filters.search.toLowerCase())) {
        return false
      }
      
      return true
    })
  }

  // Get filtered subjects for filter dropdown
  const getFilteredSubjects = () => {
    if (!filters.level_id) return subjects
    return subjects.filter(subject => subject.level_id === filters.level_id)
  }

  // Get filtered chapters for filter dropdown
  const getFilteredChapters = () => {
    if (!filters.subject_id) return chapters
    return chapters.filter(chapter => chapter.subject_id === filters.subject_id)
  }

  // Fetch subjects when level changes
  const handleLevelChange = async (levelId: string) => {
    setFormData(prev => ({
      ...prev,
      level_id: levelId,
      subject_id: null,
      chapter_id: null
    }))
    
    if (levelId) {
      try {
        const subjectsData = await getSubjects()
        const filteredSubjects = subjectsData.filter(subject => subject.level_id === levelId)
        setSubjects(filteredSubjects)
      } catch (error) {
        console.error('Error fetching subjects:', error)
        setSubjects([])
      }
    } else {
      setSubjects([])
    }
    
    // Clear chapters when level changes
    setChapters([])
  }

  // Fetch chapters when subject changes
  const handleSubjectChange = async (subjectId: string) => {
    setFormData(prev => ({
      ...prev,
      subject_id: subjectId,
      chapter_id: null
    }))
    
    if (subjectId) {
      try {
        const chaptersData = await getChapters()
        const filteredChapters = chaptersData.filter(chapter => chapter.subject_id === subjectId)
        setChapters(filteredChapters)
      } catch (error) {
        console.error('Error fetching chapters:', error)
        setChapters([])
      }
    } else {
      setChapters([])
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

    if (!formData.chapter_id) {
      alert('Veuillez sélectionner un chapitre')
      return
    }

    try {
      setSubmitting(true)
      
      // Add default tag value for API compatibility
      const exerciseData = {
        name: formData.name,
        difficulty: formData.difficulty,
        chapter_id: formData.chapter_id,
        exercise_file_urls: formData.exercise_file_urls,
        correction_file_urls: formData.correction_file_urls,
        is_public: formData.is_public,
        tag: 0 // Default tag value
      }
      
      if (editingExercise) {
        await updateExercise(editingExercise.id, exerciseData)
        alert('Exercice mis à jour avec succès!')
      } else {
        await createExercise(exerciseData)
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
      level_id: null, // Will be set after fetching chapter details
      subject_id: null, // Will be set after fetching chapter details
      chapter_id: exercise.chapter_id,
      exercise_file_urls: exercise.exercise_file_urls || [],
      correction_file_urls: exercise.correction_file_urls || [],
      is_public: (exercise as any).is_public || false
    })
    setShowForm(true)
    
    // Fetch chapter details to get level and subject information
    if (exercise.chapter_id) {
      fetchChapterDetails(exercise.chapter_id)
    }
  }

  // Fetch chapter details to populate level and subject dropdowns
  const fetchChapterDetails = async (chapterId: string) => {
    try {
      const chaptersData = await getChapters()
      const chapter = chaptersData.find(c => c.id === chapterId)
      
      if (chapter) {
        // Fetch subjects to find the one that contains this chapter
        const subjectsData = await getSubjects()
        const subject = subjectsData.find(s => s.id === chapter.subject_id)
        
        if (subject) {
          // Set the level and subject in form data
          setFormData(prev => ({
            ...prev,
            level_id: subject.level_id,
            subject_id: subject.id
          }))
          
          // Populate the dropdowns
          await handleLevelChange(subject.level_id)
          await handleSubjectChange(subject.id)
        }
      }
    } catch (error) {
      console.error('Error fetching chapter details:', error)
    }
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
      level_id: null,
      subject_id: null,
      chapter_id: null,
      exercise_file_urls: [],
      correction_file_urls: [],
      is_public: false
    })
    setEditingExercise(null)
    setShowForm(false)
    setSubjects([])
    setChapters([])
  }

  const getChapterName = (chapterId: string | null) => {
    if (!chapterId) return 'Aucun chapitre'
    const chapter = chapters.find(c => c.id === chapterId)
    return chapter ? chapter.title : 'Chapitre inconnu'
  }

  const getSubjectName = (subjectId: string | null) => {
    if (!subjectId) return 'Aucune matière'
    const subject = subjects.find(s => s.id === subjectId)
    return subject ? subject.title : 'Matière inconnue'
  }

  const getLevelName = (levelId: string | null) => {
    if (!levelId) return 'Aucun niveau'
    const level = levels.find(l => l.id === levelId)
    return level ? level.title : 'Niveau inconnu'
  }

  const getExerciseLevelName = (exercise: Exercise) => {
    const chapter = chapters.find(c => c.id === exercise.chapter_id)
    if (!chapter) return 'Niveau inconnu'
    
    const subject = subjects.find(s => s.id === chapter.subject_id)
    if (!subject) return 'Niveau inconnu'
    
    return getLevelName(subject.level_id)
  }

  const getExerciseSubjectName = (exercise: Exercise) => {
    const chapter = chapters.find(c => c.id === exercise.chapter_id)
    if (!chapter) return 'Matière inconnue'
    
    return getSubjectName(chapter.subject_id)
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
        <div className="header-controls">
          <div className="filters-section">
            <div className="filter-row">
              <div className="filter-group">
                <label>Niveau:</label>
                <CustomSelect
                  options={[
                    { value: '', label: 'Tous les niveaux' },
                    ...levels.map(level => ({
                      value: level.id,
                      label: level.title
                    }))
                  ]}
                  value={filters.level_id}
                  onChange={(value: string) => handleFilterLevelChange(value)}
                  onBlur={() => {}}
                  placeholder="Filtrer par niveau"
                />
              </div>

              <div className="filter-group">
                <label>Matière:</label>
                <CustomSelect
                  options={[
                    { value: '', label: 'Toutes les matières' },
                    ...getFilteredSubjects().map(subject => ({
                      value: subject.id,
                      label: subject.title
                    }))
                  ]}
                  value={filters.subject_id}
                  onChange={(value: string) => handleFilterSubjectChange(value)}
                  onBlur={() => {}}
                  placeholder="Filtrer par matière"
                />
              </div>

              <div className="filter-group">
                <label>Chapitre:</label>
                <CustomSelect
                  options={[
                    { value: '', label: 'Tous les chapitres' },
                    ...getFilteredChapters().map(chapter => ({
                      value: chapter.id,
                      label: chapter.title
                    }))
                  ]}
                  value={filters.chapter_id}
                  onChange={(value: string) => handleFilterChapterChange(value)}
                  onBlur={() => {}}
                  placeholder="Filtrer par chapitre"
                />
              </div>

              <div className="filter-group">
                <label>Difficulté:</label>
                <CustomSelect
                  options={[
                    { value: '', label: 'Toutes les difficultés' },
                    { value: 'Easy', label: 'Facile' },
                    { value: 'Medium', label: 'Moyen' },
                    { value: 'Hard', label: 'Difficile' }
                  ]}
                  value={filters.difficulty}
                  onChange={(value: string) => handleFilterDifficultyChange(value)}
                  onBlur={() => {}}
                  placeholder="Filtrer par difficulté"
                />
              </div>
            </div>

            <div className="filter-row">
              <div className="filter-group search-group">
                <label>Rechercher:</label>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Rechercher par nom d'exercice..."
                  className="search-input"
                />
              </div>

              <div className="filter-actions">
                <button 
                  onClick={clearFilters}
                  className="btn-clear-filters"
                  title="Effacer tous les filtres"
                >
                  🗑️ Effacer les filtres
                </button>
              </div>
            </div>
          </div>

          <button 
            className="btn-primary"
            onClick={() => setShowForm(true)}
          >
            ➕ Nouvel Exercice
          </button>
        </div>
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
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="level_id">Niveau *</label>
                  <CustomSelect
                  options={[
                    { value: '', label: 'Sélectionner un niveau' },
                    ...levels.map(level => ({
                      value: level.id,
                      label: level.title
                    }))
                  ]}
                  value={formData.level_id || ''}
                  onChange={(value: string) => handleLevelChange(value)}
                  onBlur={() => {}}
                  placeholder="Sélectionner un niveau"
                />
                </div>

                <div className="form-group">
                  <label htmlFor="subject_id">Matière *</label>
                  <CustomSelect
                  options={[
                    { value: '', label: 'Sélectionner une matière' },
                    ...subjects.map(subject => ({
                      value: subject.id,
                      label: subject.title
                    }))
                  ]}
                  value={formData.subject_id || ''}
                  onChange={(value: string) => handleSubjectChange(value)}
                  onBlur={() => {}}
                  placeholder="Sélectionner une matière"
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

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="is_public">Visibilité</label>
                  <div className="visibility-toggle">
                    <label className="toggle-label">
                      <input
                        type="checkbox"
                        checked={formData.is_public}
                        onChange={(e) => setFormData(prev => ({ ...prev, is_public: e.target.checked }))}
                        className="toggle-input"
                      />
                      <span className="toggle-slider"></span>
                      <span className="toggle-text">
                        {formData.is_public ? '🌍 Public' : '🔒 Privé'}
                      </span>
                    </label>
                    <small className="visibility-help">
                      {formData.is_public 
                        ? 'Accessible à tous les utilisateurs' 
                        : 'Accessible uniquement aux étudiants actifs'
                      }
                    </small>
                  </div>
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
        {(() => {
          const filteredExercises = getFilteredExercises()
          
          if (filteredExercises.length === 0) {
            return (
              <div className="empty-state">
                <div className="empty-icon">✏️</div>
                <h3>
                  {exercises.length === 0 
                    ? 'Aucun exercice trouvé' 
                    : 'Aucun exercice ne correspond aux filtres'
                  }
                </h3>
                <p>
                  {exercises.length === 0 
                    ? 'Commencez par créer votre premier exercice' 
                    : 'Essayez de modifier vos critères de recherche'
                  }
                </p>
                {exercises.length === 0 && (
                  <button className="btn-primary" onClick={() => setShowForm(true)}>
                    Créer un exercice
                  </button>
                )}
                {exercises.length > 0 && (
                  <button className="btn-secondary" onClick={clearFilters}>
                    Effacer les filtres
                  </button>
                )}
              </div>
            )
          }

          return (
            <>
              <div className="filter-results-info">
                <span>
                  📊 {filteredExercises.length} exercice{filteredExercises.length > 1 ? 's' : ''} trouvé{filteredExercises.length > 1 ? 's' : ''}
                  {filters.level_id || filters.subject_id || filters.chapter_id || filters.difficulty || filters.search ? 
                    ` (sur ${exercises.length} total)` : ''
                  }
                </span>
              </div>
              
              {filteredExercises.map(exercise => (
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
                      <span className="level-badge">
                        📚 {getExerciseLevelName(exercise)}
                      </span>
                      <span className="subject-badge">
                        📖 {getExerciseSubjectName(exercise)}
                      </span>
                      <span className="chapter-badge">
                        📄 {getChapterName(exercise.chapter_id)}
                      </span>
                      {exercise.difficulty && (
                        <span className={`difficulty-badge ${getDifficultyColor(exercise.difficulty)}`}>
                          {exercise.difficulty === 'Easy' ? 'Facile' : 
                           exercise.difficulty === 'Medium' ? 'Moyen' : 'Difficile'}
                        </span>
                      )}
                      <span className={`visibility-badge ${(exercise as any).is_public ? 'public' : 'private'}`}>
                        {(exercise as any).is_public ? '🌍 Public' : '🔒 Privé'}
                      </span>
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
              ))}
            </>
          )
        })()}
      </div>
    </div>
  )
}

export default ExerciseManagement