import React, { useEffect, useState, useRef } from 'react'
import { getChapters, createChapter, updateChapter, deleteChapter } from '@/lib/api/chapters'
import { getSubjects, getSubjectsByLevel, type SubjectWithLevels } from '@/lib/api/subjects'
import { getLevels } from '@/lib/api/levels'
import type { Tables } from '@/lib/supabase'
import CustomSelect from '../../shared/components/CustomSelect/CustomSelect'
import './ChapterManagement.scss'

type Chapter = Tables<'chapters'>
type Subject = SubjectWithLevels // Use the new type
type Level = Tables<'levels'>

interface ChapterFormData {
  title: string
  description: string | null
  level_id: string | null
  subject_id: string | null
  exercise_count: number | null
}

const ChapterManagement: React.FC = () => {
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [levels, setLevels] = useState<Level[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [filteredSubjects, setFilteredSubjects] = useState<Subject[]>([])
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null)
  const [formData, setFormData] = useState<ChapterFormData>({
    title: '',
    description: '',
    level_id: null,
    subject_id: null,
    exercise_count: null
  })
  const [submitting, setSubmitting] = useState(false)
  
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
      const [chaptersData, levelsData, subjectsData] = await Promise.all([
        getChapters(),
        getLevels(),
        getSubjects()
      ])
      
      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setChapters(chaptersData)
        setLevels(levelsData)
        setSubjects(subjectsData)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      // Only show alert if component is still mounted
      if (isMountedRef.current) {
        alert('Erreur lors du chargement des données')
      }
    } finally {
      // Only update loading state if component is still mounted
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }

  // Handle level selection - fetch subjects for the selected level
  const handleLevelChange = async (levelId: string | null) => {
    setFormData(prev => ({ 
      ...prev, 
      level_id: levelId,
      subject_id: null // Reset subject when level changes
    }))
    
    if (levelId) {
      try {
        const subjectsForLevel = await getSubjectsByLevel(levelId)
        if (isMountedRef.current) {
          setFilteredSubjects(subjectsForLevel)
        }
      } catch (error) {
        console.error('Error fetching subjects for level:', error)
        if (isMountedRef.current) {
          setFilteredSubjects([])
        }
      }
    } else {
      if (isMountedRef.current) {
        setFilteredSubjects([])
      }
    }
  }

  // Handle subject selection
  const handleSubjectChange = (subjectId: string | null) => {
    setFormData(prev => ({ ...prev, subject_id: subjectId }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      alert('Le titre est obligatoire')
      return
    }

    if (!formData.level_id) {
      alert('Veuillez sélectionner un niveau')
      return
    }

    if (!formData.subject_id) {
      alert('Veuillez sélectionner une matière')
      return
    }

    try {
      setSubmitting(true)
      
      // Prepare data for API (remove level_id as it's not part of the chapter table)
      const { level_id, ...chapterData } = formData
      
      // Add default difficulty since database schema requires it
      const finalChapterData = {
        ...chapterData,
        difficulty: 'Beginner' as const, // Default difficulty value
        type: 'Theory' as const, // Default type value
        estimated_time: '2 heures' // Default estimated time value
      }
      
      if (editingChapter) {
        await updateChapter(editingChapter.id, finalChapterData)
        // Only show alert if component is still mounted
        if (isMountedRef.current) {
          alert('Chapitre mis à jour avec succès!')
        }
      } else {
        await createChapter(finalChapterData)
        // Only show alert if component is still mounted
        if (isMountedRef.current) {
          alert('Chapitre créé avec succès!')
        }
      }

      await fetchData()
      // Only reset form if component is still mounted
      if (isMountedRef.current) {
        resetForm()
      }
    } catch (error) {
      console.error('Error saving chapter:', error)
      // Only show alert if component is still mounted
      if (isMountedRef.current) {
        alert('Erreur lors de la sauvegarde')
      }
    } finally {
      // Only update submitting state if component is still mounted
      if (isMountedRef.current) {
        setSubmitting(false)
      }
    }
  }

  const handleEdit = async (chapter: Chapter) => {
    setEditingChapter(chapter)
    setFormData({
      title: chapter.title,
      description: chapter.description,
      level_id: null, // Will be set after fetching subject details
      subject_id: chapter.subject_id,
      exercise_count: chapter.exercise_count
    })
    setShowForm(true)
    
    // Fetch subject details to get level information
    if (chapter.subject_id) {
      await fetchSubjectDetails(chapter.subject_id)
    }
  }

  // Fetch subject details to populate level dropdown when editing
  const fetchSubjectDetails = async (subjectId: string) => {
    try {
      const subject = subjects.find(s => s.id === subjectId)
      if (subject && subject.level_ids && subject.level_ids.length > 0) {
        // Use the first level_id from the array (or you could show all levels)
        const firstLevelId = subject.level_ids[0]
        setFormData(prev => ({ ...prev, level_id: firstLevelId }))
        // Fetch subjects for this level
        const subjectsForLevel = await getSubjectsByLevel(firstLevelId)
        if (isMountedRef.current) {
          setFilteredSubjects(subjectsForLevel)
        }
      }
    } catch (error) {
      console.error('Error fetching subject details:', error)
    }
  }

  const handleDelete = async (chapter: Chapter) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le chapitre "${chapter.title}" ?`)) {
      return
    }

    try {
      await deleteChapter(chapter.id)
      // Only show alert if component is still mounted
      if (isMountedRef.current) {
        alert('Chapitre supprimé avec succès!')
      }
      await fetchData()
    } catch (error) {
      console.error('Error deleting chapter:', error)
      // Only show alert if component is still mounted
      if (isMountedRef.current) {
        alert('Erreur lors de la suppression')
      }
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      level_id: null,
      subject_id: null,
      exercise_count: null
    })
    setEditingChapter(null)
    setShowForm(false)
    setFilteredSubjects([])
  }

  const getSubjectName = (subjectId: string | null) => {
    if (!subjectId) return 'Aucune matière'
    const subject = subjects.find(s => s.id === subjectId)
    return subject ? subject.title : 'Matière inconnue'
  }

  const getLevelName = (subjectId: string | null) => {
    if (!subjectId) return 'Niveau inconnu'
    const subject = subjects.find(s => s.id === subjectId)
    if (!subject) return 'Niveau inconnu'
    
    // Since subjects can now have multiple levels, we'll show the first one
    // or you could show all levels
    if (subject.level_ids && subject.level_ids.length > 0) {
      const firstLevelId = subject.level_ids[0]
      const level = levels.find(l => l.id === firstLevelId)
      return level ? level.title : 'Niveau inconnu'
    }
    
    return 'Niveau inconnu'
  }

  if (loading) {
    return (
      <div className="chapter-management">
        <div className="loading">Chargement des chapitres...</div>
      </div>
    )
  }

  return (
    <div className="chapter-management">
      <div className="management-header">
        <h1>📖 Gestion des Chapitres</h1>
        <div className="header-controls">
          <div className="subject-filter">
            <label htmlFor="subject-select">Filtrer par matière:</label>
            <CustomSelect
              options={[
                { value: '', label: 'Toutes les matières' },
                ...subjects.map(subject => ({
                  value: subject.id,
                  label: subject.title
                }))
              ]}
              value={selectedSubject || ''}
              onChange={(value) => setSelectedSubject(value || null)}
              onBlur={() => {}}
              placeholder="Toutes les matières"
            />
          </div>
          <button 
            className="btn-primary"
            onClick={() => setShowForm(true)}
          >
            ➕ Nouveau Chapitre
          </button>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => {
          // Only reset form if component is still mounted
          if (isMountedRef.current) {
            resetForm()
          }
        }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingChapter ? '✏️ Modifier le Chapitre' : '➕ Nouveau Chapitre'}</h2>
              <button className="close-btn" onClick={() => {
                // Only reset form if component is still mounted
                if (isMountedRef.current) {
                  resetForm()
                }
              }}>✕</button>
            </div>

            <form onSubmit={handleSubmit} className="chapter-form">
              <div className="form-group">
                <label htmlFor="title">Titre *</label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Ex: Arrays and Lists"
                  required
                />
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
                    onChange={(value) => handleLevelChange(value || null)}
                    onBlur={() => {}}
                    placeholder="Sélectionner un niveau"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="subject_id">Matière *</label>
                  <CustomSelect
                    options={[
                      { value: '', label: formData.level_id ? 'Sélectionner une matière' : 'Sélectionnez d\'abord un niveau' },
                      ...filteredSubjects.map(subject => ({
                        value: subject.id,
                        label: subject.title
                      }))
                    ]}
                    value={formData.subject_id || ''}
                    onChange={(value) => handleSubjectChange(value || null)}
                    onBlur={() => {}}
                    placeholder={formData.level_id ? 'Sélectionner une matière' : 'Sélectionnez d\'abord un niveau'}
                    disabled={!formData.level_id}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Description du chapitre..."
                  rows={4}
                />
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => {
                  // Only reset form if component is still mounted
                  if (isMountedRef.current) {
                    resetForm()
                  }
                }} className="btn-secondary">
                  Annuler
                </button>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? 'Sauvegarde...' : (editingChapter ? 'Mettre à jour' : 'Créer')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Chapters List */}
      <div className="chapters-grid">
        {chapters.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📖</div>
            <h3>Aucun chapitre trouvé</h3>
            <p>Commencez par créer votre premier chapitre</p>
            <button className="btn-primary" onClick={() => setShowForm(true)}>
              Créer un chapitre
            </button>
          </div>
        ) : (
          chapters.map(chapter => (
            <div key={chapter.id} className="chapter-card">
              <div className="card-header">
                <h3>{chapter.title}</h3>
                <div className="card-actions">
                  <button 
                    onClick={() => handleEdit(chapter)}
                    className="btn-edit"
                    title="Modifier"
                  >
                    ✏️
                  </button>
                  <button 
                    onClick={() => handleDelete(chapter)}
                    className="btn-delete"
                    title="Supprimer"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <div className="card-content">
                <p className="description">
                  {chapter.description || 'Aucune description'}
                </p>
                
                <div className="card-meta">
                  <div className="level-subject-info">
                    <span className="level-badge">
                      📚 {getLevelName(chapter.subject_id)}
                    </span>
                    <span className="subject-badge">
                      📖 {getSubjectName(chapter.subject_id)}
                    </span>
                  </div>
                  
                  <div className="badges-row">
                    {/* Type badges removed */}
                  </div>

                  <div className="exercise-count">
                    ✏️ {chapter.exercise_count || 0} exercice(s)
                  </div>

                  <span className="date">
                    Créé le {new Date(chapter.created_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>

              <div className="card-footer">
                <span className="chapter-id">ID: {chapter.id.slice(0, 8)}...</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default ChapterManagement