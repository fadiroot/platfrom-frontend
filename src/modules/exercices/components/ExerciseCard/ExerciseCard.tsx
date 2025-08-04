"use client"

import type React from "react"
import { useTranslation } from 'react-i18next'
import "./ExerciseCard.scss"
import type { Exercise } from "../../types/exercise"
import { CheckCircle2, Play, BookOpen, ArrowRight } from "lucide-react"

interface ExerciseCardProps {
  exercise: Exercise
  onClick: (exercise: Exercise) => void
  onToggleComplete?: (exerciseId: string, event: React.MouseEvent) => void
}

const ExerciseCard: React.FC<ExerciseCardProps> = ({ exercise, onClick, onToggleComplete }) => {
  const { t } = useTranslation('translation')
  const isCompleted = Boolean(exercise.completed)

  const getDifficultyText = (tag: number) => {
    switch (tag) {
      case 0:
        return t('exercises.difficulty.easy')
      case 1:
        return t('exercises.difficulty.medium')
      case 2:
        return t('exercises.difficulty.hard')
      default:
        return "Unknown"
    }
  }

  return (
    <div className={`exercise-card ${isCompleted ? "completed" : ""}`} onClick={() => onClick(exercise)}>
      {/* Compact Header */}
      <div className="card-header">
        <div className="header-content">
          <div className="title-section">
            <h3 className="exercise-title">{exercise.name}</h3>
            <div className="badges">
              <span className={`difficulty-badge difficulty-${exercise.tag}`}>{getDifficultyText(exercise.tag)}</span>
            </div>
          </div>
          {isCompleted && (
            <div className="completion-indicator">
              <CheckCircle2 className="icon" />
            </div>
          )}
        </div>
      </div>

      {/* Compact Stats */}
      <div className="card-content">
        <div className="stats-row">
          <div className="stat-item">
            <div className="stat-icon exercise-files">
              <BookOpen className="icon" />
            </div>
            <span className="stat-number">{exercise.exerciseFileUrls.length}</span>
            <span className="stat-label">Files</span>
          </div>

          <div className="stat-item">
            <div className="stat-icon solution-files">
              <CheckCircle2 className="icon" />
            </div>
            <span className="stat-number">{exercise.correctionFileUrls.length}</span>
            <span className="stat-label">Solutions</span>
          </div>
        </div>
      </div>

      {/* Compact Footer */}
      <div className="card-footer">
        <div className="footer-actions">
          {onToggleComplete && (
            <button
              className={`complete-btn ${isCompleted ? "completed" : ""}`}
              onClick={(e) => onToggleComplete(exercise.id, e)}
              title={isCompleted ? "Mark as incomplete" : "Mark as complete"}
            >
              <CheckCircle2 className="icon" />
            </button>
          )}

          <button className="start-btn">
            <Play className="icon" />
            <span>{isCompleted ? t('exercises.review') : t('exercises.start')}</span>
            <ArrowRight  className="arrow-icon" />
          </button>
        </div>
      </div>

      {/* Hover Overlay */}
      <div className="hover-overlay">
        <div className="overlay-content">
          <Play className="play-icon" />
          <span className="overlay-text">{isCompleted ? t('exercises.review') : t('exercises.start')}</span>
        </div>
      </div>
    </div>
  )
}

export default ExerciseCard
