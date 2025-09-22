import React, { useEffect, useState, useRef } from 'react'
import { getSubjects, createSubject, updateSubject, deleteSubject, type SubjectWithLevels } from '@/lib/api/subjects'
import { getLevels } from '@/lib/api/levels'
import type { Tables } from '@/lib/supabase'
import CustomSelect from '../../shared/components/CustomSelect/CustomSelect'
import './SubjectManagement.scss'

type Level = Tables<'levels'>

// Predefined subject icons
const SUBJECT_ICONS = [
  { id: 'math', name: '🧮 Mathématiques', icon: '🧮', url: '/doodles/rular.svg' },
  { id: 'physics', name: '⚡ Physique', icon: '⚡', url: '/doodles/physics.svg' },
  { id: 'chemistry', name: '🧪 Chimie', icon: '🧪', url: '/doodles/science-d.svg' },
  { id: 'computer', name: '💻 Informatique', icon: '💻', url: '/computer.svg' },
  { id: 'literature', name: '📚 Littérature', icon: '📚', url: '/doodles/book.svg' },
  { id: 'history', name: '🏛️ Histoire', icon: '🏛️', url: '/doodles/cap-d.svg' },
  { id: 'geography', name: '🌍 Géographie', icon: '🌍', url: '/doodles/cap-l.svg' },
  { id: 'biology', name: '🧬 Biologie', icon: '🧬', url: '/doodles/science-d.svg' },
  { id: 'philosophy', name: '🤔 Philosophie', icon: '🤔', url: '/doodles/exmark.svg' },
  { id: 'language', name: '🗣️ Langues', icon: '🗣️', url: '/doodles/speaker.svg' },
  { id: 'art', name: '🎨 Arts', icon: '🎨', url: '/doodles/superman.svg' },
  { id: 'music', name: '🎵 Musique', icon: '🎵', url: '/doodles/speaker.svg' },
  { id: 'sports', name: '⚽ Sport', icon: '⚽', url: '/doodles/superman.svg' },
  { id: 'economics', name: '💰 Économie', icon: '💰', url: '/doodles/arrows.svg' },
  { id: 'quiz', name: '❓ Quiz/Tests', icon: '❓', url: '/doodles/quiz.svg' },
  { id: 'custom', name: '🔗 URL personnalisée', icon: '🔗', url: null }
]

interface SubjectFormData {
  title: string
  description: string | null
  level_ids: string[]
  image_url: string | null
  selected_icon: string | null
}

const SubjectManagement: React.FC = () => {
  const [subjects, setSubjects] = useState<SubjectWithLevels[]>([])
  const [levels, setLevels] = useState<Level[]>([])
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingSubject, setEditingSubject] = useState<SubjectWithLevels | null>(null)
  const [formData, setFormData] = useState<SubjectFormData>({
    title: '',
    description: '',
    level_ids: [],
    image_url: null,
    selected_icon: null
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
      const [subjectsData, levelsData] = await Promise.all([
        getSubjects(),
        getLevels()
      ])
      
      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setSubjects(subjectsData)
        setLevels(levelsData)
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

  const handleIconSelect = (iconId: string) => {
    const selectedIcon = SUBJECT_ICONS.find(icon => icon.id === iconId)
    if (selectedIcon) {
      setFormData(prev => ({
        ...prev,
        selected_icon: iconId,
        image_url: selectedIcon.url
      }))
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
      
      // Prepare data for submission (exclude selected_icon as it's not in the database)
      const submitData = {
        title: formData.title,
        description: formData.description,
        level_ids: formData.level_ids,
        image_url: formData.image_url
      }
      
      if (editingSubject) {
        await updateSubject(editingSubject.id, submitData)
        // Only show alert if component is still mounted
        if (isMountedRef.current) {
          alert('Matière mise à jour avec succès!')
        }
      } else {
        await createSubject(submitData)
        // Only show alert if component is still mounted
        if (isMountedRef.current) {
          alert('Matière créée avec succès!')
        }
      }

      await fetchData()
      // Only reset form if component is still mounted
      if (isMountedRef.current) {
        resetForm()
      }
    } catch (error) {
      console.error('Error saving subject:', error)
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

  const handleEdit = (subject: SubjectWithLevels) => {
    setEditingSubject(subject)
    
    // Find which predefined icon matches the current image_url
    const matchingIcon = SUBJECT_ICONS.find(icon => icon.url === subject.image_url)
    
    setFormData({
      title: subject.title,
      description: subject.description,
      level_ids: subject.level_ids,
      image_url: subject.image_url,
      selected_icon: matchingIcon ? matchingIcon.id : 'custom'
    })
    setShowForm(true)
  }

  const handleDelete = async (subject: SubjectWithLevels) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer la matière "${subject.title}" ?`)) {
      return
    }

    try {
      await deleteSubject(subject.id)
      // Only show alert if component is still mounted
      if (isMountedRef.current) {
        alert('Matière supprimée avec succès!')
      }
      await fetchData()
    } catch (error) {
      console.error('Error deleting subject:', error)
      // Only show alert if component is still mounted
      if (isMountedRef.current) {
        alert('Erreur lors de la suppression')
      }
    }
  }

  const resetForm = () => {
    setFormData({ title: '', description: '', level_ids: [], image_url: null, selected_icon: null })
    setEditingSubject(null)
    setShowForm(false)
  }

  const getLevelName = (levelId: string | null) => {
    if (!levelId) return 'Aucun niveau'
    const level = levels.find(l => l.id === levelId)
    return level ? level.title : 'Niveau inconnu'
  }

  // Filter subjects by selected level
  const getFilteredSubjects = () => {
    if (!selectedLevel) return subjects
    return subjects.filter(subject => subject.level_ids.includes(selectedLevel))
  }

  // Group subjects by level for display
  const getSubjectsByLevel = () => {
    const grouped = levels.reduce((acc, level) => {
      acc[level.id] = subjects.filter(subject => subject.level_ids.includes(level.id))
      return acc
    }, {} as Record<string, SubjectWithLevels[]>)
    
    // Add subjects without level
    const noLevelSubjects = subjects.filter(subject => subject.level_ids.length === 0)
    if (noLevelSubjects.length > 0) {
      grouped['no-level'] = noLevelSubjects
    }
    
    return grouped
  }

  if (loading) {
    return (
      <div className="subject-management">
        <div className="loading">Chargement des matières...</div>
      </div>
    )
  }

  return (
    <div className="subject-management">
      <div className="management-header">
        <h1>📚 Gestion des Matières</h1>
        <div className="header-controls">
          <div className="level-filter">
            <label htmlFor="level-select">Filtrer par niveau:</label>
            <CustomSelect
              options={[
                { value: '', label: 'Tous les niveaux' },
                ...levels.map(level => ({
                  value: level.id,
                  label: level.title
                }))
              ]}
              value={selectedLevel || ''}
              onChange={(value) => setSelectedLevel(value || null)}
              onBlur={() => {}}
              placeholder="Tous les niveaux"
            />
          </div>
          <button 
            className="btn-primary"
            onClick={() => setShowForm(true)}
          >
            ➕ Nouvelle Matière
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
              <h2>{editingSubject ? '✏️ Modifier la Matière' : '➕ Nouvelle Matière'}</h2>
              <button className="close-btn" onClick={() => {
                // Only reset form if component is still mounted
                if (isMountedRef.current) {
                  resetForm()
                }
              }}>✕</button>
            </div>

            <form onSubmit={handleSubmit} className="subject-form">
              <div className="form-group">
                <label htmlFor="title">Titre *</label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Ex: Algorithmique et Programmation"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="level_ids">Niveaux *</label>
                <div className="multi-select-levels">
                  {levels.map(level => (
                    <label key={level.id} className="level-checkbox">
                      <input
                        type="checkbox"
                        checked={formData.level_ids.includes(level.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData(prev => ({
                              ...prev,
                              level_ids: [...prev.level_ids, level.id]
                            }))
                          } else {
                            setFormData(prev => ({
                              ...prev,
                              level_ids: prev.level_ids.filter(id => id !== level.id)
                            }))
                          }
                        }}
                      />
                      <span className="checkbox-label">{level.title}</span>
                    </label>
                  ))}
                  {levels.length === 0 && (
                    <p className="no-levels">Aucun niveau disponible</p>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Description de la matière..."
                  rows={4}
                />
              </div>

              <div className="form-group">
                <label htmlFor="icon_selector">Icône de la matière</label>
                <div className="icon-selector">
                  {SUBJECT_ICONS.map(iconOption => (
                    <div
                      key={iconOption.id}
                      className={`icon-option ${formData.selected_icon === iconOption.id ? 'selected' : ''}`}
                      onClick={() => handleIconSelect(iconOption.id)}
                      title={iconOption.name}
                    >
                      <div className="icon-preview">
                        {iconOption.url ? (
                          <img src={iconOption.url} alt={iconOption.name} className="icon-svg" />
                        ) : (
                          <span className="icon-emoji">{iconOption.icon}</span>
                        )}
                      </div>
                      <span className="icon-name">{iconOption.name}</span>
                    </div>
                  ))}
                </div>
                
                {/* Custom URL input - only show when custom is selected */}
                {formData.selected_icon === 'custom' && (
                  <div className="custom-url-input">
                    <label htmlFor="custom_image_url">URL personnalisée</label>
                    <input
                      type="url"
                      id="custom_image_url"
                      value={formData.image_url || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                )}
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
                  {submitting ? 'Sauvegarde...' : (editingSubject ? 'Mettre à jour' : 'Créer')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Subjects List */}
      {selectedLevel ? (
        // Filtered view by selected level
        <div className="subjects-section">
          <h2 className="section-title">
            📚 {getLevelName(selectedLevel)} ({getFilteredSubjects().length} matière{getFilteredSubjects().length !== 1 ? 's' : ''})
          </h2>
          <div className="subjects-grid">
            {getFilteredSubjects().length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📚</div>
                <h3>Aucune matière trouvée pour ce niveau</h3>
                <p>Commencez par créer une matière pour ce niveau</p>
                <button className="btn-primary" onClick={() => setShowForm(true)}>
                  Créer une matière
                </button>
              </div>
            ) : (
              getFilteredSubjects().map(subject => (
            <div key={subject.id} className="subject-card">
              <div className="card-header">
                <h3>{subject.title}</h3>
                <div className="card-actions">
                  <button 
                    onClick={() => handleEdit(subject)}
                    className="btn-edit"
                    title="Modifier"
                  >
                    ✏️
                  </button>
                  <button 
                    onClick={() => handleDelete(subject)}
                    className="btn-delete"
                    title="Supprimer"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <div className="card-content">
                {subject.image_url && (
                  <div className="subject-image">
                    <img src={subject.image_url} alt={subject.title} />
                  </div>
                )}
                
                <p className="description">
                  {subject.description || 'Aucune description'}
                </p>
                
                <div className="card-meta">
                  <div className="level-badges">
                    {subject.level_ids.length > 0 ? (
                      subject.level_ids.map(levelId => (
                        <span key={levelId} className="level-badge">
                          🎓 {getLevelName(levelId)}
                        </span>
                      ))
                    ) : (
                      <span className="level-badge no-level">🎓 Aucun niveau</span>
                    )}
                  </div>
                  <span className="date">
                    Créé le {new Date(subject.created_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>

              <div className="card-footer">
                <span className="subject-id">ID: {subject.id.slice(0, 8)}...</span>
              </div>
            </div>
                ))
              )}
            </div>
          </div>
        ) : (
          // Grouped view by level
          <div className="subjects-by-level">
            {Object.entries(getSubjectsByLevel()).map(([levelId, levelSubjects]) => (
              <div key={levelId} className="level-section">
                <h2 className="section-title">
                  🎓 {levelId === 'no-level' ? 'Sans niveau assigné' : getLevelName(levelId)} 
                  <span className="count">({levelSubjects.length} matière{levelSubjects.length !== 1 ? 's' : ''})</span>
                </h2>
                <div className="subjects-grid">
                  {levelSubjects.map(subject => (
                    <div key={subject.id} className="subject-card">
                      <div className="card-header">
                        <h3>{subject.title}</h3>
                        <div className="card-actions">
                          <button 
                            onClick={() => handleEdit(subject)}
                            className="btn-edit"
                            title="Modifier"
                          >
                            ✏️
                          </button>
                          <button 
                            onClick={() => handleDelete(subject)}
                            className="btn-delete"
                            title="Supprimer"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>

                      <div className="card-content">
                        {subject.image_url && (
                          <div className="subject-image">
                            <img src={subject.image_url} alt={subject.title} />
                          </div>
                        )}
                        
                        <p className="description">
                          {subject.description || 'Aucune description'}
                        </p>
                        
                        <div className="card-meta">
                          <div className="level-badges">
                            {subject.level_ids.length > 0 ? (
                              subject.level_ids.map(levelId => (
                                <span key={levelId} className="level-badge">
                                  🎓 {getLevelName(levelId)}
                                </span>
                              ))
                            ) : (
                              <span className="level-badge no-level">🎓 Aucun niveau</span>
                            )}
                          </div>
                          <span className="date">
                            Créé le {new Date(subject.created_at).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      </div>

                      <div className="card-footer">
                        <span className="subject-id">ID: {subject.id.slice(0, 8)}...</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {subjects.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">📚</div>
                <h3>Aucune matière trouvée</h3>
                <p>Commencez par créer votre première matière</p>
                <button className="btn-primary" onClick={() => setShowForm(true)}>
                  Créer une matière
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

export default SubjectManagement