import React, { useEffect, useState } from 'react'
import './index.scss'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { getSubjectsWithLevel, getSubjectsByLevelWithLevel } from '@/lib/api/subjects'
import { RootState } from '@/modules/shared/store'
import Cap from '@/modules/shared/svgs/Cap'
import HandDrawnArrow from '@/modules/shared/svgs/HandDrawnArrow'

// Define the Subject interface with level information
interface Subject {
  id: string
  title: string
  description: string | null
  image_url: string | null
  level_id: string | null
  level?: {
    id: string
    title: string
    description: string | null
  } | null
}

const SubjectList: React.FC = () => {
  const navigate = useNavigate()
  const { t } = useTranslation('translation')
  
  // Get user information from auth state
  const { user } = useSelector((state: RootState) => state.auth)

  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)

    const fetchSubjects = async () => {
      try {
        let subjects: Subject[]
        
        // If user has a level_id, fetch subjects for that level with level information
        if (user?.level_id) {
          subjects = await getSubjectsByLevelWithLevel(user.level_id)
        } else {
          // Fallback to all subjects with level information if no level_id (shouldn't happen for students)
          subjects = await getSubjectsWithLevel()
        }
        
        setSubjects(subjects)
      } catch (err: any) {
        setError(err.message || 'Failed to fetch subjects')
      } finally {
        setLoading(false)
      }
    }

    fetchSubjects()
  }, [user?.level_id])

  const handleSubjectClick = (subjectId: string) => {
    navigate(`/subjects/${subjectId}/chapters`)
  }

  if (loading) {
    return <div style={{ padding: 32 }}>Loading...</div>
  }

  if (error) {
    return <div style={{ padding: 32, color: 'red' }}>Error: {error}</div>
  }

  return (
    <div className="subject-list-container">
      <h1 className="subject-list-title">
        {user?.level_id ? t('subjects.titleWithLevel', { level: user.level?.title || 'Level' }) : t('subjects.title')}
      </h1>
      <p className="subject-list-subtitle">{t('subjects.subtitle')}</p>
      <Cap className="subject-list-cap" />
      <HandDrawnArrow className="subject-list-arrow" />

      <div className="subject-grid">
        {subjects.length === 0 && (
          <div className="no-subjects-message">
            {user?.level_id 
              ? t('subjects.noSubjectsForLevel', { level: user.level?.title || 'your level' })
              : t('subjects.noSubjects')
            }
          </div>
        )}
        {subjects.map((subject) => (
          <div
            className="subject-card"
            key={subject.id}
            onClick={() => handleSubjectClick(subject.id)}
          >
            <div className="subject-icon">
              {subject.image_url ? (
                <img src={subject.image_url} alt={subject.title} className="subject-icon-img" />
              ) : (
                <span className="default-icon">📘</span>
              )}
            </div>
            <h2 className="subject-name">{subject.level ? `${subject.title} - ${subject.level.title}` : subject.title}</h2>
            <p className="subject-description">
              {subject.description || t('subjects.noDescription')}
            </p>
            <div className="subject-meta">
              <button className="explore-button">{t('subjects.explore')}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default SubjectList
