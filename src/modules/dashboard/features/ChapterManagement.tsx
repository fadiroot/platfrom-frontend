import React, { useEffect, useState, useRef } from 'react'
import { getChapters, createChapter, updateChapter, deleteChapter } from '@/lib/api/chapters'
import { getSubjects } from '@/lib/api/subjects'
import type { Tables } from '@/lib/supabase'
import CustomSelect from '../../shared/components/CustomSelect/CustomSelect'
import './ChapterManagement.scss'

type Chapter = Tables<'chapters'>
type Subject = Tables<'subjects'>

interface ChapterFormData {
  title: string
  description: string | null
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | null
  type: 'Theory' | 'Practical' | 'Assessment' | null
  estimated_time: string | null
  subject_id: string | null
  exercise_count: number | null
}

const ChapterManagement: React.FC = () => {
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null)
  const [formData, setFormData] = useState<ChapterFormData>({
    title: '',
    description: '',
    difficulty: null,
    type: null,
    estimated_time: '',
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
      const [chaptersData, subjectsData] = await Promise.all([
        getChapters(),
        getSubjects()
      ])
      
      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setChapters(chaptersData)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      alert('Le titre est obligatoire')
      return
    }

    try {
      setSubmitting(true)
      
      if (editingChapter) {
        await updateChapter(editingChapter.id, formData)
        // Only show alert if component is still mounted
        if (isMountedRef.current) {
          alert('Chapitre mis à jour avec succès!')
        }
      } else {
        await createChapter(formData)
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

  const handleEdit = (chapter: Chapter) => {
    setEditingChapter(chapter)
    setFormData({
      title: chapter.title,
      description: chapter.description,
      difficulty: chapter.difficulty,
      type: chapter.type,
      estimated_time: chapter.estimated_time,
      subject_id: chapter.subject_id,
      exercise_count: chapter.exercise_count
    })
    setShowForm(true)
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
      difficulty: null,
      type: null,
      estimated_time: '',
      subject_id: null,
      exercise_count: null
    })
    setEditingChapter(null)
    setShowForm(false)
  }

  const getSubjectName = (subjectId: string | null) => {
    if (!subjectId) return 'Aucune matière'
    const subject = subjects.find(s => s.id === subjectId)
    return subject ? subject.title : 'Matière inconnue'
  }

  // Removed unused functions: getFilteredChapters and getChaptersBySubject

  const getDifficultyColor = (difficulty: string | null) => {
    switch (difficulty) {
      case 'Beginner': return 'green'
      case 'Intermediate': return 'orange'
      case 'Advanced': return 'red'
      default: return 'gray'
    }
  }

  const getTypeIcon = (type: string | null) => {
    switch (type) {
      case 'Theory': return '📚'
      case 'Practical': return '⚙️'
      case 'Assessment': return '📋'
      default: return '📖'
    }
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
                  onChange={(value) => setFormData(prev => ({ ...prev, subject_id: value || null }))}
                  onBlur={() => {}}
                  placeholder="Sélectionner une matière"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="difficulty">Difficulté</label>
                  <CustomSelect
                    options={[
                      { value: '', label: 'Sélectionner la difficulté' },
                      { value: 'Beginner', label: 'Débutant' },
                      { value: 'Intermediate', label: 'Intermédiaire' },
                      { value: 'Advanced', label: 'Avancé' }
                    ]}
                    value={formData.difficulty || ''}
                    onChange={(value) => setFormData(prev => ({ ...prev, difficulty: value as any || null }))}
                    onBlur={() => {}}
                    placeholder="Sélectionner la difficulté"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="type">Type</label>
                  <CustomSelect
                    options={[
                      { value: '', label: 'Sélectionner le type' },
                      { value: 'Theory', label: 'Théorie' },
                      { value: 'Practical', label: 'Pratique' },
                      { value: 'Assessment', label: 'Évaluation' }
                    ]}
                    value={formData.type || ''}
                    onChange={(value) => setFormData(prev => ({ ...prev, type: value as any || null }))}
                    onBlur={() => {}}
                    placeholder="Sélectionner le type"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="estimated_time">Temps estimé</label>
                <input
                  type="text"
                  id="estimated_time"
                  value={formData.estimated_time || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, estimated_time: e.target.value }))}
                  placeholder="Ex: 2 heures, 3h 30min"
                />
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
                  <span className="subject-badge">
                    📚 {getSubjectName(chapter.subject_id)}
                  </span>
                  
                  <div className="badges-row">
                    {chapter.difficulty && (
                      <span className={`difficulty-badge ${getDifficultyColor(chapter.difficulty)}`}>
                        {chapter.difficulty === 'Beginner' ? 'Débutant' : 
                         chapter.difficulty === 'Intermediate' ? 'Intermédiaire' : 'Avancé'}
                      </span>
                    )}
                    {chapter.type && (
                      <span className="type-badge">
                        {getTypeIcon(chapter.type)} {
                          chapter.type === 'Theory' ? 'Théorie' :
                          chapter.type === 'Practical' ? 'Pratique' : 'Évaluation'
                        }
                      </span>
                    )}
                  </div>

                  {chapter.estimated_time && (
                    <div className="time-info">
                      ⏱️ {chapter.estimated_time}
                    </div>
                  )}

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