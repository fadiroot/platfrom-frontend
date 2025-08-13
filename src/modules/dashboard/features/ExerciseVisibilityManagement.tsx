import React, { useState, useEffect } from 'react'
import { Eye, EyeOff, Search, Filter, BarChart3 } from 'lucide-react'
import { getAccessibleExercises, getPublicExercises, toggleExercisePublicStatus, bulkUpdateExercisePublicStatus, getExerciseStatistics } from '@/lib/api/userManagement'
import './ExerciseVisibilityManagement.scss'

interface Exercise {
  id: string
  title: string
  description?: string
  subject_title?: string
  chapter_title?: string
  level_title?: string
  is_public: boolean
  created_at: string
  difficulty?: string
}

interface ExerciseStats {
  total_exercises: number
  public_exercises: number
  private_exercises: number
}

const ExerciseVisibilityManagement: React.FC = () => {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterVisibility, setFilterVisibility] = useState<'all' | 'public' | 'private'>('all')
  const [stats, setStats] = useState<ExerciseStats | null>(null)
  const [selectedExercises, setSelectedExercises] = useState<string[]>([])
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    filterExercises()
  }, [exercises, searchTerm, filterVisibility])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [allExercises, exerciseStats] = await Promise.all([
        getAccessibleExercises(),
        getExerciseStatistics()
      ])
      
      setExercises(allExercises || [])
      setStats(exerciseStats)
    } catch (error) {
      console.error('Error fetching exercise data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterExercises = () => {
    let filtered = exercises

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(exercise =>
        exercise.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exercise.subject_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exercise.chapter_title?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply visibility filter
    if (filterVisibility !== 'all') {
      filtered = filtered.filter(exercise => {
        if (filterVisibility === 'public') return exercise.is_public
        if (filterVisibility === 'private') return !exercise.is_public
        return true
      })
    }

    setFilteredExercises(filtered)
  }

  const handleToggleVisibility = async (exerciseId: string, isPublic: boolean) => {
    try {
      setProcessing(true)
      await toggleExercisePublicStatus(exerciseId, isPublic)
      
      // Update local state
      setExercises(prev => prev.map(exercise => 
        exercise.id === exerciseId 
          ? { ...exercise, is_public: isPublic }
          : exercise
      ))
      
      // Refresh stats
      const updatedStats = await getExerciseStatistics()
      setStats(updatedStats)
    } catch (error) {
      console.error('Error updating exercise visibility:', error)
      alert('Failed to update exercise visibility')
    } finally {
      setProcessing(false)
    }
  }

  const handleBulkUpdate = async (isPublic: boolean) => {
    if (selectedExercises.length === 0) {
      alert('Please select exercises to update')
      return
    }

    try {
      setProcessing(true)
      await bulkUpdateExercisePublicStatus(selectedExercises, isPublic)
      
      // Update local state
      setExercises(prev => prev.map(exercise => 
        selectedExercises.includes(exercise.id)
          ? { ...exercise, is_public: isPublic }
          : exercise
      ))
      
      setSelectedExercises([])
      
      // Refresh stats
      const updatedStats = await getExerciseStatistics()
      setStats(updatedStats)
    } catch (error) {
      console.error('Error bulk updating exercises:', error)
      alert('Failed to bulk update exercises')
    } finally {
      setProcessing(false)
    }
  }

  const handleSelectExercise = (exerciseId: string) => {
    setSelectedExercises(prev => 
      prev.includes(exerciseId)
        ? prev.filter(id => id !== exerciseId)
        : [...prev, exerciseId]
    )
  }

  const handleSelectAll = () => {
    if (selectedExercises.length === filteredExercises.length) {
      setSelectedExercises([])
    } else {
      setSelectedExercises(filteredExercises.map(exercise => exercise.id))
    }
  }

  if (loading) {
    return (
      <div className="exercise-visibility-management">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading exercises...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="exercise-visibility-management">
      <div className="page-header">
        <h1>Exercise Visibility Management</h1>
        <p>Manage which exercises are publicly accessible to deactivated users</p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <BarChart3 size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-number">{stats.total_exercises}</div>
              <div className="stat-label">Total Exercises</div>
            </div>
          </div>
          <div className="stat-card public">
            <div className="stat-icon">
              <Eye size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-number">{stats.public_exercises}</div>
              <div className="stat-label">Public Exercises</div>
            </div>
          </div>
          <div className="stat-card private">
            <div className="stat-icon">
              <EyeOff size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-number">{stats.private_exercises}</div>
              <div className="stat-label">Private Exercises</div>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="controls-section">
        <div className="search-filter-row">
          <div className="search-box">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search exercises..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="filter-dropdown">
            <Filter size={20} />
            <select
              value={filterVisibility}
              onChange={(e) => setFilterVisibility(e.target.value as 'all' | 'public' | 'private')}
            >
              <option value="all">All Exercises</option>
              <option value="public">Public Only</option>
              <option value="private">Private Only</option>
            </select>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedExercises.length > 0 && (
          <div className="bulk-actions">
            <span>{selectedExercises.length} exercise(s) selected</span>
            <button
              className="btn btn-success"
              onClick={() => handleBulkUpdate(true)}
              disabled={processing}
            >
              <Eye size={16} />
              Make Public
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => handleBulkUpdate(false)}
              disabled={processing}
            >
              <EyeOff size={16} />
              Make Private
            </button>
          </div>
        )}
      </div>

      {/* Exercise Table */}
      <div className="table-container">
        <table className="exercise-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={selectedExercises.length === filteredExercises.length && filteredExercises.length > 0}
                  onChange={handleSelectAll}
                />
              </th>
              <th>Exercise</th>
              <th>Subject</th>
              <th>Chapter</th>
              <th>Level</th>
              <th>Visibility</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredExercises.map((exercise) => (
              <tr key={exercise.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedExercises.includes(exercise.id)}
                    onChange={() => handleSelectExercise(exercise.id)}
                  />
                </td>
                <td>
                  <div className="exercise-info">
                    <div className="exercise-title">{exercise.title}</div>
                    {exercise.description && (
                      <div className="exercise-description">{exercise.description}</div>
                    )}
                  </div>
                </td>
                <td>{exercise.subject_title || 'N/A'}</td>
                <td>{exercise.chapter_title || 'N/A'}</td>
                <td>{exercise.level_title || 'N/A'}</td>
                <td>
                  <span className={`visibility-badge ${exercise.is_public ? 'public' : 'private'}`}>
                    {exercise.is_public ? (
                      <><Eye size={14} /> Public</>
                    ) : (
                      <><EyeOff size={14} /> Private</>
                    )}
                  </span>
                </td>
                <td>
                  <button
                    className={`btn btn-sm ${exercise.is_public ? 'btn-secondary' : 'btn-success'}`}
                    onClick={() => handleToggleVisibility(exercise.id, !exercise.is_public)}
                    disabled={processing}
                  >
                    {exercise.is_public ? (
                      <><EyeOff size={14} /> Make Private</>
                    ) : (
                      <><Eye size={14} /> Make Public</>
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredExercises.length === 0 && (
          <div className="empty-state">
            <p>No exercises found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ExerciseVisibilityManagement