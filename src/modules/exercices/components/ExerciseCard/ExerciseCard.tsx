"use client"

import React from 'react'
import { useTranslation } from 'react-i18next'
import { Play, BookOpen, CheckCircle2, ArrowRight, Lock, CheckCircle } from "lucide-react"

import './ExerciseCard.scss'
import type { Exercise } from '../../types/exercise'

interface ExerciseCardProps {
  exercise: Exercise
  onClick: (exercise: Exercise) => void
  onToggleComplete?: (exerciseId: string, event: React.MouseEvent) => void
  isPremium?: boolean
  hasAccess?: boolean
}

const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise,
  onClick,
  onToggleComplete,
  isPremium = false,
  hasAccess = true
}) => {
  const { t } = useTranslation('translation')
  const isCompleted = exercise.completed || false

  const getDifficultyText = (tag: number) => {
    switch (tag) {
      case 0:
        return t('exercises.difficulty.easy')
      case 1:
        return t('exercises.difficulty.medium')
      case 2:
        return t('exercises.difficulty.hard')
      default:
        return t('exercises.difficulty.easy')
    }
  }

  const handleCardClick = (e: React.MouseEvent) => {
    // If it's a premium exercise and user doesn't have access, trigger premium modal
    if (isPremium && !hasAccess) {
      e.stopPropagation()
      // The parent component will handle showing the premium modal
      onClick(exercise)
      return
    }
    onClick(exercise)
  }

  return (
    <div
      className={`exercise-card ${isCompleted ? "completed" : ""} ${isPremium && !hasAccess ? "premium-locked" : ""} ${hasAccess ? "available" : ""}`}
      onClick={handleCardClick}
    >
      {/* Compact Header */}
      <div className="card-header">
        <div className="header-content">
          <div className="title-section">
            <h3 className="exercise-title">{exercise.name}</h3>
            <div className="badges">
              <span className={`difficulty-badge difficulty-${exercise.tag}`}>{getDifficultyText(exercise.tag)}</span>
              {isPremium && !hasAccess && (
                <span className="premium-badge">
                  <Lock className="premium-icon" />
                  {t('exercises.premium')}
                </span>
              )}
              {hasAccess && (
                <span className="available-badge">
                  <CheckCircle className="available-icon" />
                  {t('exercises.available')}
                </span>
              )}
            </div>
          </div>
          {isCompleted && (
            <div className="completion-indicator">
              <CheckCircle2 className="icon" />
            </div>
          )}
        </div>
      </div>

      {/* Compact Footer */}
      <div className="card-footer">
        <div className="footer-actions">
          {onToggleComplete && hasAccess && (
            <button
              className={`complete-btn ${isCompleted ? "completed" : ""}`}
              onClick={(e) => onToggleComplete(exercise.id, e)}
              title={isCompleted ? "Mark as incomplete" : "Mark as complete"}
            >
              <CheckCircle2 className="icon" />
            </button>
          )}

          <button className={`start-btn ${isPremium && !hasAccess ? "upgrade-required" : ""}`}>
            {isPremium && !hasAccess ? (
              <>
                <Lock className="icon" />
                <span>{t('exercises.upgradeRequired')}</span>
              </>
            ) : (
              <>
                <Play className="icon" />
                <span>{isCompleted ? t('exercises.review') : t('exercises.start')}</span>
                <ArrowRight className="arrow-icon" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Hover Overlay for Available Exercises */}
      {hasAccess && (
        <div className="hover-overlay">
          <div className="overlay-content">
            <Play className="play-icon" />
            <span className="overlay-text">{isCompleted ? t('exercises.review') : t('exercises.start')}</span>
          </div>
        </div>
      )}

      {/* Premium Lock Overlay */}
      {isPremium && !hasAccess && (
        <div className="premium-overlay">
          <div className="overlay-content">
            <Lock className="lock-icon" />
            <span className="overlay-text">{t('exercises.premiumContent')}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default ExerciseCard
