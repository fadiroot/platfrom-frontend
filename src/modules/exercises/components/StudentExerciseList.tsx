import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  getAccessibleExercises,
  getPublicExercises,
  getCurrentUserActivationStatus
} from '@/lib/api/userManagement'
import { getDashboardPlaceholders } from '../../../utils/rtlUtils'
import './StudentExerciseList.scss'

interface Exercise {
  id: string
  title: string
  description?: string
  difficulty_level?: string
  chapter_id?: string
  chapter_title?: string
  subject_title?: string
  level_title?: string
  is_public?: boolean
  created_at: string
  updated_at: string
}

interface StudentExerciseListProps {
  chapterId?: string
  subjectId?: string
  levelId?: string
}

const StudentExerciseList: React.FC<StudentExerciseListProps> = ({
  chapterId,
  subjectId,
  levelId
}) => {
  const { i18n } = useTranslation();
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [userStatus, setUserStatus] = useState<{
    is_active: boolean
    subscription_end_date: string | null
    subscription_type: string | null
  } | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDifficulty, setFilterDifficulty] = useState<'all' | 'easy' | 'medium' | 'hard'>('all')
  
  // RTL support
  const isRTL = i18n?.language === 'ar';
  const placeholders = getDashboardPlaceholders(isRTL);

  useEffect(() => {
    fetchData()
  }, [chapterId, subjectId, levelId])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Get user activation status
      const status = await getCurrentUserActivationStatus()
      setUserStatus(status)
      
      // Get exercises based on user status
      let exercisesData: Exercise[]
      if (status.is_active) {
        // Active users get all accessible exercises
        exercisesData = await getAccessibleExercises(chapterId, subjectId, levelId)
      } else {
        // Inactive users only get public exercises
        exercisesData = await getPublicExercises(chapterId, subjectId, levelId)
      }
      
      setExercises(exercisesData)
    } catch (error: any) {
      console.error('Error fetching exercises:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredExercises = exercises.filter(exercise => {
    const matchesSearch = 
      exercise.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exercise.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesDifficulty = 
      filterDifficulty === 'all' ||
      exercise.difficulty_level?.toLowerCase() === filterDifficulty
    
    return matchesSearch && matchesDifficulty
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'green'
      case 'medium': return 'orange'
      case 'hard': return 'red'
      default: return 'gray'
    }
  }

  const getSubscriptionStatus = () => {
    if (!userStatus) return null
    
    if (!userStatus.is_active) {
      return {
        status: 'inactive',
        message: 'Your account is not active. You can only access public exercises.',
        color: 'red'
      }
    }
    
    if (!userStatus.subscription_end_date) {
      return {
        status: 'active',
        message: 'You have full access to all exercises.',
        color: 'green'
      }
    }
    
    const endDate = new Date(userStatus.subscription_end_date)
    const now = new Date()
    
    if (endDate < now) {
      return {
        status: 'expired',
        message: 'Your subscription has expired. You can only access public exercises.',
        color: 'red'
      }
    }
    
    const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysLeft <= 7) {
      return {
        status: 'expiring',
        message: `Your subscription expires in ${daysLeft} day(s). Contact admin to renew.`,
        color: 'orange'
      }
    }
    
    return {
      status: 'active',
      message: `Your subscription is active until ${formatDate(userStatus.subscription_end_date)}.`,
      color: 'green'
    }
  }

  if (loading) {
    return (
      <div 
        className={`student-exercise-list ${isRTL ? 'rtl' : 'ltr'}`}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="loading">Loading exercises...</div>
      </div>
    )
  }

  const subscriptionStatus = getSubscriptionStatus()

  return (
    <div 
      className={`student-exercise-list ${isRTL ? 'rtl' : 'ltr'}`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="student-exercise-list__header">
        <h2>Available Exercises</h2>
        
        {subscriptionStatus && (
          <div className={`subscription-status ${subscriptionStatus.color}`}>
            <div className="status-icon">
              {subscriptionStatus.status === 'active' && '✅'}
              {subscriptionStatus.status === 'inactive' && '❌'}
              {subscriptionStatus.status === 'expired' && '⏰'}
              {subscriptionStatus.status === 'expiring' && '⚠️'}
            </div>
            <div className="status-message">{subscriptionStatus.message}</div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="filters">
        <div className="search-box">
          <input
            type="text"
            placeholder={placeholders.searchExercisesSimple}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-buttons">
          <button
            className={filterDifficulty === 'all' ? 'active' : ''}
            onClick={() => setFilterDifficulty('all')}
          >
            All
          </button>
          <button
            className={filterDifficulty === 'easy' ? 'active' : ''}
            onClick={() => setFilterDifficulty('easy')}
          >
            Easy
          </button>
          <button
            className={filterDifficulty === 'medium' ? 'active' : ''}
            onClick={() => setFilterDifficulty('medium')}
          >
            Medium
          </button>
          <button
            className={filterDifficulty === 'hard' ? 'active' : ''}
            onClick={() => setFilterDifficulty('hard')}
          >
            Hard
          </button>
        </div>
      </div>

      {/* Exercise Grid */}
      <div className="exercises-grid">
        {filteredExercises.map(exercise => (
          <div key={exercise.id} className="exercise-card">
            <div className="exercise-header">
              <h3 className="exercise-title">{exercise.title}</h3>
              <div className="exercise-badges">
                {exercise.difficulty_level && (
                  <span className={`difficulty-badge ${getDifficultyColor(exercise.difficulty_level)}`}>
                    {exercise.difficulty_level}
                  </span>
                )}
                {!userStatus?.is_active && exercise.is_public && (
                  <span className="access-badge public">Free Trial</span>
                )}
                {userStatus?.is_active && (
                  <span className="access-badge premium">Premium</span>
                )}
              </div>
            </div>
            
            {exercise.description && (
              <div className="exercise-description">
                {exercise.description.length > 150 
                  ? `${exercise.description.substring(0, 150)}...`
                  : exercise.description
                }
              </div>
            )}
            
            <div className="exercise-meta">
              {exercise.chapter_title && (
                <div className="meta-item">
                  <span className="meta-label">Chapter:</span>
                  <span className="meta-value">{exercise.chapter_title}</span>
                </div>
              )}
              {exercise.subject_title && (
                <div className="meta-item">
                  <span className="meta-label">Subject:</span>
                  <span className="meta-value">{exercise.subject_title}</span>
                </div>
              )}
              <div className="meta-item">
                <span className="meta-label">Created:</span>
                <span className="meta-value">{formatDate(exercise.created_at)}</span>
              </div>
            </div>
            
            <div className="exercise-actions">
              <button 
                className="btn-start-exercise"
                onClick={() => {
                  // Navigate to exercise detail or start exercise
                  console.log('Starting exercise:', exercise.id)
                }}
              >
                Start Exercise
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredExercises.length === 0 && (
        <div className="no-exercises">
          <div className="no-exercises-icon">📚</div>
          <h3>No exercises available</h3>
          <p>
            {!userStatus?.is_active 
              ? "No public exercises are available. Contact admin to activate your account for full access."
              : "No exercises match your current filters."
            }
          </p>
        </div>
      )}
    </div>
  )
}

export default StudentExerciseList