import React, { useEffect, useState } from 'react'
import { getLevels, createLevel, updateLevel, deleteLevel } from '@/lib/api/levels'
import type { Tables } from '@/lib/supabase'
import './LevelManagement.scss'

type Level = Tables<'levels'>

interface LevelFormData {
  title: string
  description: string | null
}

const LevelManagement: React.FC = () => {
  const [levels, setLevels] = useState<Level[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingLevel, setEditingLevel] = useState<Level | null>(null)
  const [formData, setFormData] = useState<LevelFormData>({
    title: '',
    description: ''
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchLevels()
  }, [])

  const fetchLevels = async () => {
    try {
      setLoading(true)
      const data = await getLevels()
      setLevels(data)
    } catch (error) {
      console.error('Error fetching levels:', error)
      alert('Erreur lors du chargement des niveaux')
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
      
      if (editingLevel) {
        // Update existing level
        await updateLevel(editingLevel.id, formData)
        alert('Niveau mis à jour avec succès!')
      } else {
        // Create new level
        await createLevel(formData)
        alert('Niveau créé avec succès!')
      }

      // Refresh list and close form
      await fetchLevels()
      resetForm()
    } catch (error) {
      console.error('Error saving level:', error)
      alert('Erreur lors de la sauvegarde')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (level: Level) => {
    setEditingLevel(level)
    setFormData({
      title: level.title,
      description: level.description
    })
    setShowForm(true)
  }

  const handleDelete = async (level: Level) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le niveau "${level.title}" ?`)) {
      return
    }

    try {
      await deleteLevel(level.id)
      alert('Niveau supprimé avec succès!')
      await fetchLevels()
    } catch (error) {
      console.error('Error deleting level:', error)
      alert('Erreur lors de la suppression')
    }
  }

  const resetForm = () => {
    setFormData({ title: '', description: '' })
    setEditingLevel(null)
    setShowForm(false)
  }

  if (loading) {
    return (
      <div className="level-management">
        <div className="loading">Chargement des niveaux...</div>
      </div>
    )
  }

  return (
    <div className="level-management">
      <div className="management-header">
        <h1>🎓 Gestion des Niveaux</h1>
        <button 
          className="btn-primary"
          onClick={() => setShowForm(true)}
        >
          ➕ Nouveau Niveau
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => resetForm()}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingLevel ? '✏️ Modifier le Niveau' : '➕ Nouveau Niveau'}</h2>
              <button className="close-btn" onClick={resetForm}>✕</button>
            </div>

            <form onSubmit={handleSubmit} className="level-form">
              <div className="form-group">
                <label htmlFor="title">Titre *</label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Ex: Bac 1 Informatique"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Description du niveau..."
                  rows={4}
                />
              </div>

              <div className="form-actions">
                <button type="button" onClick={resetForm} className="btn-secondary">
                  Annuler
                </button>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? 'Sauvegarde...' : (editingLevel ? 'Mettre à jour' : 'Créer')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Levels List */}
      <div className="levels-grid">
        {levels.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎓</div>
            <h3>Aucun niveau trouvé</h3>
            <p>Commencez par créer votre premier niveau</p>
            <button className="btn-primary" onClick={() => setShowForm(true)}>
              Créer un niveau
            </button>
          </div>
        ) : (
          levels.map(level => (
            <div key={level.id} className="level-card">
              <div className="card-header">
                <h3>{level.title}</h3>
                <div className="card-actions">
                  <button 
                    onClick={() => handleEdit(level)}
                    className="btn-edit"
                    title="Modifier"
                  >
                    ✏️
                  </button>
                  <button 
                    onClick={() => handleDelete(level)}
                    className="btn-delete"
                    title="Supprimer"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <div className="card-content">
                <p className="description">
                  {level.description || 'Aucune description'}
                </p>
                <div className="card-meta">
                  <span className="date">
                    Créé le {new Date(level.created_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>

              <div className="card-footer">
                <span className="level-id">ID: {level.id.slice(0, 8)}...</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default LevelManagement