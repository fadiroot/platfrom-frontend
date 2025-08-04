import React, { useEffect, useState } from 'react'
import { getSubjects, createSubject, updateSubject, deleteSubject } from '@/lib/api/subjects'
import { getLevels } from '@/lib/api/levels'
import type { Tables } from '@/lib/supabase'
import './SubjectManagement.scss'

type Subject = Tables<'subjects'>
type Level = Tables<'levels'>

interface SubjectFormData {
  title: string
  description: string | null
  level_id: string | null
  image_url: string | null
}

const SubjectManagement: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [levels, setLevels] = useState<Level[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null)
  const [formData, setFormData] = useState<SubjectFormData>({
    title: '',
    description: '',
    level_id: null,
    image_url: null
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [subjectsData, levelsData] = await Promise.all([
        getSubjects(),
        getLevels()
      ])
      setSubjects(subjectsData)
      setLevels(levelsData)
    } catch (error) {
      console.error('Error fetching data:', error)
      alert('Erreur lors du chargement des données')
    } finally {
      setLoading(false)
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
      
      if (editingSubject) {
        await updateSubject(editingSubject.id, formData)
        alert('Matière mise à jour avec succès!')
      } else {
        await createSubject(formData)
        alert('Matière créée avec succès!')
      }

      await fetchData()
      resetForm()
    } catch (error) {
      console.error('Error saving subject:', error)
      alert('Erreur lors de la sauvegarde')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (subject: Subject) => {
    setEditingSubject(subject)
    setFormData({
      title: subject.title,
      description: subject.description,
      level_id: subject.level_id,
      image_url: subject.image_url
    })
    setShowForm(true)
  }

  const handleDelete = async (subject: Subject) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer la matière "${subject.title}" ?`)) {
      return
    }

    try {
      await deleteSubject(subject.id)
      alert('Matière supprimée avec succès!')
      await fetchData()
    } catch (error) {
      console.error('Error deleting subject:', error)
      alert('Erreur lors de la suppression')
    }
  }

  const resetForm = () => {
    setFormData({ title: '', description: '', level_id: null, image_url: null })
    setEditingSubject(null)
    setShowForm(false)
  }

  const getLevelName = (levelId: string | null) => {
    if (!levelId) return 'Aucun niveau'
    const level = levels.find(l => l.id === levelId)
    return level ? level.title : 'Niveau inconnu'
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
        <button 
          className="btn-primary"
          onClick={() => setShowForm(true)}
        >
          ➕ Nouvelle Matière
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => resetForm()}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingSubject ? '✏️ Modifier la Matière' : '➕ Nouvelle Matière'}</h2>
              <button className="close-btn" onClick={resetForm}>✕</button>
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
                <label htmlFor="level_id">Niveau *</label>
                <select
                  id="level_id"
                  value={formData.level_id || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, level_id: e.target.value || null }))}
                  required
                >
                  <option value="">Sélectionner un niveau</option>
                  {levels.map(level => (
                    <option key={level.id} value={level.id}>
                      {level.title}
                    </option>
                  ))}
                </select>
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
                <label htmlFor="image_url">URL de l'image (optionnelle)</label>
                <input
                  type="url"
                  id="image_url"
                  value={formData.image_url || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="form-actions">
                <button type="button" onClick={resetForm} className="btn-secondary">
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
      <div className="subjects-grid">
        {subjects.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📚</div>
            <h3>Aucune matière trouvée</h3>
            <p>Commencez par créer votre première matière</p>
            <button className="btn-primary" onClick={() => setShowForm(true)}>
              Créer une matière
            </button>
          </div>
        ) : (
          subjects.map(subject => (
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
                  <span className="level-badge">
                    🎓 {getLevelName(subject.level_id)}
                  </span>
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
  )
}

export default SubjectManagement