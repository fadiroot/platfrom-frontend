'use client'

import React from 'react'
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import './index.scss'
import { getChaptersBySubject, getChaptersByLevel } from '@/lib/api/chapters'
import { getSubjectById } from '@/lib/api/subjects'
import { getLevelById } from '@/lib/api/levels'
import Loader from '../../../shared/components/Loader/Loader'
import Cap from '@/modules/shared/svgs/Cap'

// Define the Chapter interface to match the database schema
interface Chapter {
  id: string
  title: string
  description: string | null
  exercise_count: number | null
  progress?: number
  estimated_time?: string | null
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced' | null
  type?: 'Theory' | 'Practical' | 'Assessment' | null
  name?: string
  exercises?: { count: number }[]
}

const ChaptersList: React.FC = () => {
  const { subjectId, levelId } = useParams<{ subjectId?: string; levelId?: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation('translation')
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [subjectName, setSubjectName] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (levelId) {
      setLoading(true)
      setError(null)

      Promise.all([getChaptersByLevel(levelId), getLevelById(levelId)])
        .then(([chaptersData, levelData]) => {
          setChapters(chaptersData)
          setSubjectName(levelData?.title || 'Level Chapters')
        })
        .catch((err) => setError(err.message || 'Failed to fetch chapters'))
        .finally(() => setLoading(false))
    } else if (subjectId) {
      setLoading(true)
      setError(null)

      Promise.all([getChaptersBySubject(subjectId), getSubjectById(subjectId)])
        .then(([chaptersData, subjectData]) => {
          setChapters(chaptersData)
          setSubjectName(subjectData?.title || 'Professional Course')
        })
        .catch((err) => setError(err.message || 'Failed to fetch chapters'))
        .finally(() => setLoading(false))
    }
  }, [subjectId, levelId])

  const handleChapterClick = (chapterId: string) => {
    navigate(`/subjects/${subjectId}/chapters/${chapterId}/exercises`)
  }





  const totalExercises = chapters.reduce((sum, chapter) => sum + (chapter.exercise_count || 0), 0)

  return (
    <div className="chapters-container">
      <div className="chapters-header">
        <button className="back-btn" onClick={() => navigate('/subjects')}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            className="back-icon"
            strokeWidth="2"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          {t('chapters.backToSubjects')}
        </button>

        <div className="header-content">
          <h1 className="course-title">{subjectName}</h1>
        </div>
        <Cap className="chapters-list-cap" />

        {/* Course Statistics */}
        <div className="course-stats">
          <div className="stat-card">
            <div className="stat-icon">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
            </div>
            <div className="stat-content">
              <span className="stat-label">Total Chapters</span>
              <span className="stat-value">{chapters.length}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14,2 14,8 20,8" />
              </svg>
            </div>
            <div className="stat-content">
              <span className="stat-label">Total Exercises</span>
              <span className="stat-value">{totalExercises}</span>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <Loader fullScreen />
      ) : error ? (
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <p>Error: {error}</p>
        </div>
      ) : (
        <div className="chapters-list">
          {chapters.map((chapter, index) => {
            return (
              <div
                className="chapter-card"
                key={chapter.id}
                onClick={() => handleChapterClick(chapter.id)}
              >
                <div className="chapter-header">
                  <div className="chapter-number">{String(index + 1).padStart(2, '0')}</div>

                  <div className="chapter-main">
                    <div className="chapter-title-row">
                      <h2 className="chapter-title">{chapter.name || chapter.title}</h2>
                    </div>

                    <div className="chapter-meta">
                      <div className="meta-item">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14,2 14,8 20,8" />
                        </svg>
                        <span>{chapter.exercise_count ?? 0} exercises</span>
                      </div>
                    </div>
                  </div>

                  <div className="chapter-actions">
                    <button 
                      className={`action-btn ${
                        chapter.progress === 100 
                          ? 'review-btn' 
                          : chapter.progress 
                          ? 'continue-btn' 
                          : 'start-btn'
                      }`}
                    >
                      {chapter.progress === 100
                        ? t('chapters.review')
                        : chapter.progress
                        ? t('chapters.continue')
                        : t('chapters.start')}
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                    </button>
                  </div>
                </div>

                {chapter.progress !== undefined && (
                  <div className="chapter-progress">
                    <div className="progress-header">
                      <span className="progress-label">Progress</span>
                      <span className="progress-value">{chapter.progress}%</span>
                    </div>
                    <div className="progress-track">
                      <div className="progress-bar" style={{ width: `${chapter.progress}%` }}></div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default ChaptersList
