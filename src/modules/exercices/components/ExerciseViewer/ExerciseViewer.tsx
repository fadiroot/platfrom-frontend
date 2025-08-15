'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { IoArrowBack, IoDocumentText, IoCheckmarkCircle, IoChevronBack, IoChevronForward } from 'react-icons/io5'
import { getSecureExerciseFiles, getSecureFileUrl } from '@/lib/api/exercises'
import { supabase } from '@/lib/supabase'
import DefaultPDFViewer, { preloadPDF } from './DefaultPDFViewer.tsx'
import './ExerciseViewer.scss'

interface ExerciseViewerProps {
  exercise: {
    id: string
    code?: string
    name: string
    tag: number
    difficulty?: string
    exerciseFileUrls?: string[]
    correctionFileUrls?: string[]
  }
  onBack: () => void
  exerciseIndex?: number
}

const ExerciseViewer: React.FC<ExerciseViewerProps> = ({ exercise, onBack, exerciseIndex }) => {
  const { t, i18n } = useTranslation()
  const [activeTab, setActiveTab] = useState<'exercise' | 'solution'>('exercise')
  
  // Determine if current language is RTL
  const isRTL = i18n.language === 'ar'
  const [selectedFileIdx, setSelectedFileIdx] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [secureExerciseFiles, setSecureExerciseFiles] = useState<string[]>([])
  const [secureCorrectionFiles, setSecureCorrectionFiles] = useState<string[]>([])
  const [hasAccess, setHasAccess] = useState(false)
  const [loadingFiles, setLoadingFiles] = useState(true)
  const preloadedFiles = useRef(new Set<string>())

  // Preload PDFs for better performance
  const preloadPDFFile = async (fileUrl: string) => {
    if (!fileUrl || preloadedFiles.current.has(fileUrl)) return
    
    preloadedFiles.current.add(fileUrl)
    await preloadPDF(fileUrl, exercise.id)
  }

  // Load secure files when component mounts
  useEffect(() => {
    const loadSecureFiles = async () => {
      try {
        setLoadingFiles(true)
        setError(null)
        
        console.log('Loading secure files for exercise:', exercise.id, 'index:', exerciseIndex)
        
        const secureFiles = await getSecureExerciseFiles(exercise.id, exerciseIndex)
        
        console.log('Secure files result:', secureFiles)
        
        if (secureFiles.hasAccess) {
          console.log('Setting exercise files:', secureFiles.exerciseFiles)
          console.log('Setting correction files:', secureFiles.correctionFiles)
          setSecureExerciseFiles(secureFiles.exerciseFiles)
          setSecureCorrectionFiles(secureFiles.correctionFiles)
          setHasAccess(true)
        } else {
          console.log('Access denied for exercise:', exercise.id)
          setHasAccess(false)
          setError('Access denied: Premium content requires active subscription')
        }
      } catch (error) {
        console.error('Error loading secure files:', error)
        setError('Failed to load exercise files')
        setHasAccess(false)
      } finally {
        setLoadingFiles(false)
      }
    }

    loadSecureFiles()
  }, [exercise.id, exerciseIndex])

  // Preload adjacent files for faster switching
  useEffect(() => {
    if (!hasAccess || loadingFiles) return
    
    const currentFiles = getCurrentFiles()
    if (currentFiles.length === 0) return
    
    // Preload current file if not already loaded
    const currentFile = currentFiles[selectedFileIdx]
    if (currentFile) {
      preloadPDFFile(currentFile)
    }
    
    // Preload next and previous files
    const nextIdx = selectedFileIdx + 1
    const prevIdx = selectedFileIdx - 1
    
    if (nextIdx < currentFiles.length) {
      setTimeout(() => preloadPDFFile(currentFiles[nextIdx]), 100)
    }
    if (prevIdx >= 0) {
      setTimeout(() => preloadPDFFile(currentFiles[prevIdx]), 200)
    }
    
    // Preload files from the other tab (exercise/solution)
    const otherFiles = activeTab === 'exercise' ? secureCorrectionFiles : secureExerciseFiles
    if (otherFiles.length > 0 && selectedFileIdx < otherFiles.length) {
      setTimeout(() => preloadPDFFile(otherFiles[selectedFileIdx]), 300)
    }
  }, [selectedFileIdx, activeTab, hasAccess, loadingFiles, secureExerciseFiles, secureCorrectionFiles])

  // Get current files based on active tab
  const getCurrentFiles = () => {
    if (activeTab === 'exercise') {
      return secureExerciseFiles
    } else {
      return secureCorrectionFiles
    }
  }

  const files = getCurrentFiles()

  // Get current PDF URL for the default viewer
  const getCurrentPDFUrl = () => {
    const currentFiles = getCurrentFiles()
    if (currentFiles && currentFiles.length > selectedFileIdx) {
      return currentFiles[selectedFileIdx]
    }
    return null
  }

  const handleFileSelect = (fileIndex: number) => {
    setSelectedFileIdx(fileIndex)
  }



  const getDifficultyText = (difficulty: string) => {
    // Convert to string and handle both string and number inputs
    const difficultyStr = String(difficulty).toLowerCase()
    
    switch (difficultyStr) {
      case 'easy':
      case '0':
        return t('exercises.difficulty.easy')
      case 'medium':
      case '1':
        return t('exercises.difficulty.medium')
      case 'hard':
      case '2':
        return t('exercises.difficulty.hard')
      case 'expert':
      case '3':
        return t('exercises.difficulty.expert', 'EXPERT')
      default:
        return t('exercises.difficulty.easy')
    }
  }

  const getDifficultyClass = (difficulty: string) => {
    const difficultyStr = String(difficulty).toLowerCase()
    
    switch (difficultyStr) {
      case 'easy':
      case '0':
        return 'difficulty-easy'
      case 'medium':
      case '1':
        return 'difficulty-medium'
      case 'hard':
      case '2':
        return 'difficulty-hard'
      case 'expert':
      case '3':
        return 'difficulty-expert'
      default:
        return 'difficulty-easy'
    }
  }

  const getFileIcon = (url: string) => {
    const extension = url.split('.').pop()?.toLowerCase()
    switch (extension) {
      case 'pdf':
        return '📄'
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
        return '🖼️'
      default:
        return '📄'
    }
  }

  const getFileName = (url: string) => {
    return url.split('/').pop() || 'Unknown File'
  }

  const getFileType = (url: string) => {
    const extension = url.split('.').pop()?.toUpperCase() || 'PDF'
    return extension
  }

  if (loadingFiles) {
    return (
      <div className="exercise-viewer-modern">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading exercise files...</p>
        </div>
      </div>
    )
  }

  if (!hasAccess) {
    return (
      <div className="exercise-viewer-modern">
        <div className="access-denied-container">
          <h3>Access Denied</h3>
          <p>{error}</p>
          <button onClick={onBack} className="back-btn-modern">
            <IoArrowBack />
            {t('exercises.backToExercises')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="exercise-viewer-modern">
      {/* Header */}
      <div className="header-modern">
        <button className="back-btn-modern" onClick={onBack}>
          <IoArrowBack />
          <span>{t('exercises.backToExercises')}</span>
        </button>
        
        <div className="header-center">
          <div className="left-content">
            <div className="exercise-code">{exercise.code || exercise.name}</div>
            <div className={`difficulty-badge ${getDifficultyClass(exercise.difficulty)}`}>
              {getDifficultyText(exercise.difficulty)}
            </div>
          </div>
          
          {/* Tab Switcher in Header */}
          <div 
            className={`tab-switcher-header ${activeTab === 'exercise' ? 'exercise-active' : 'solution-active'} ${isRTL ? 'rtl' : 'ltr'}`}
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            <div 
              className={`tab-btn-header ${activeTab === 'exercise' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('exercise')
                setSelectedFileIdx(0)
              }}
            >
              <IoDocumentText style={{ strokeWidth: '2.5px' }} />
              <span>{t('exerciseViewer.exerciseTab')}</span>
            </div>
            <div 
              className={`tab-btn-header ${activeTab === 'solution' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('solution')
                setSelectedFileIdx(0)
              }}
            >
              <IoCheckmarkCircle style={{ strokeWidth: '2.5px' }} />
              <span>{t('exerciseViewer.correctionTab')}</span>
            </div>
          </div>
        </div>
        

      </div>

      {/* Content */}
      <div className="content-card full-height">
        {/* Main PDF Viewer - Full Width */}
        <div className="custom-pdf-viewer full-width">
          {getCurrentPDFUrl() ? (
            <DefaultPDFViewer 
              fileUrl={getCurrentPDFUrl()!}
              exerciseId={exercise.id}
              hideLoader={true}
            />
          ) : (
            <div className="no-pdf">
              <div className="no-pdf-icon">📄</div>
              <span>No PDF file available</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ExerciseViewer
