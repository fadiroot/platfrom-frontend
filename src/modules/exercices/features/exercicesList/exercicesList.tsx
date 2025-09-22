import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import ExerciseCard from '../../components/ExerciseCard/ExerciseCard';
import ExerciseViewer from '../../components/ExerciseViewer/ExerciseViewer';
import PremiumModal from '../../../shared/components/PremiumModal/PremiumModal';
import { getExercisesByChapterWithAccess, canAccessExercise } from '@/lib/api/exercises';
import { getChapterById } from '@/lib/api/chapters';
import type { Exercise as SupabaseExercise } from '@/lib/api/exercises';
import { Exercise } from '../../types/exercise';
import Loader from '../../../shared/components/Loader/Loader';
import Cap from '@/modules/shared/svgs/Cap';
import './index.scss';

const ExercisesList: React.FC = () => {
  const { t } = useTranslation('translation');
  const { chapterId, subjectId } = useParams<{ chapterId: string; subjectId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chapterTitle, setChapterTitle] = useState<string>('');
  const [accessibleExercises, setAccessibleExercises] = useState<string[]>([]);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [premiumExerciseId, setPremiumExerciseId] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');

  // Get exercise ID from URL search params
  const exerciseIdFromUrl = searchParams.get('exercise');

  useEffect(() => {
    if (chapterId) {
      setLoading(true);
      setError(null);
      
      Promise.all([
        getExercisesByChapterWithAccess(chapterId),
        getChapterById(chapterId)
      ])
        .then(([exercisesData, chapterData]) => {
          // Map the secure exercise data (without file URLs) to local exercise format
          const mappedExercises = exercisesData.exercises.map((exercise) => ({
            id: exercise.id,
            name: exercise.name,
            tag: exercise.tag || 0,
            difficulty: exercise.difficulty || 'Easy',
            chapterId: exercise.chapter_id,
            subjectId: exercise.chapter_id, // Using chapter_id as subjectId for compatibility
            exerciseFileUrls: [], // Empty array - files will be loaded securely when needed
            correctionFileUrls: [], // Empty array - files will be loaded securely when needed
            completed: false // Default value - will be updated when user progress is loaded
          }));
          
          setExercises(mappedExercises);
          setAccessibleExercises(exercisesData.accessibleExercises);
          
          if (chapterData) {
            setChapterTitle(chapterData.title);
          }
        })
        .catch((err) => {
          console.error('Error fetching exercises:', err);
          setError(err.message || 'Failed to load exercises');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [chapterId]);

  // Restore exercise viewer state from URL on component mount
  useEffect(() => {
    if (exerciseIdFromUrl && exercises.length > 0) {
      const exercise = exercises.find(ex => ex.id === exerciseIdFromUrl);
      
      if (exercise) {
        // Check if user has access to this exercise
        const exerciseIndex = exercises.findIndex(ex => ex.id === exercise.id);
        const hasAccess = accessibleExercises.includes(exercise.id);
        
        if (hasAccess) {
          setSelectedExercise(exercise);
        } else {
          // If no access, clear the exercise param from URL
          const newSearchParams = new URLSearchParams(searchParams);
          newSearchParams.delete('exercise');
          setSearchParams(newSearchParams);
        }
      } else {
        // Exercise not found, clear the exercise param from URL
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.delete('exercise');
        setSearchParams(newSearchParams);
      }
    } else if (!exerciseIdFromUrl && selectedExercise) {
      // If URL doesn't have exercise param but we have selected exercise, clear it
      setSelectedExercise(null);
    }
  }, [exerciseIdFromUrl, exercises, accessibleExercises, searchParams, setSearchParams, selectedExercise]);

  const handleExerciseClick = async (exercise: Exercise) => {
    // Check if user has access to this exercise
    const hasAccess = accessibleExercises.includes(exercise.id);
    
    if (!hasAccess) {
      setPremiumExerciseId(exercise.id);
      setShowPremiumModal(true);
      return;
    }
    
    // Update URL with exercise ID using search parameters
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('exercise', exercise.id);
    setSearchParams(newSearchParams);
    
    setSelectedExercise(exercise);
  };

  const handleClosePremiumModal = () => {
    setShowPremiumModal(false);
    setPremiumExerciseId(null);
  };

  const handleContactAdmin = () => {
    alert(t('premium.contactInfo') || 'Please contact your administrator to activate your account.');
    handleClosePremiumModal();
  };

  const handleCloseViewer = () => {
    setSelectedExercise(null);
    // Clear exercise ID from URL search parameters
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.delete('exercise');
    setSearchParams(newSearchParams);
  };

  const handleBackToChapters = () => {
    console.log('Navigating back to chapters. subjectId:', subjectId, 'chapterId:', chapterId);
    if (subjectId) {
      const chaptersPath = `/subjects/${subjectId}/chapters`;
      console.log('Navigating to:', chaptersPath);
      navigate(chaptersPath);
    } else {
      // Fallback to browser back if subjectId is not available
      console.log('SubjectId not available, using browser back');
      navigate(-1);
    }
  };

  const handleDifficultyFilter = (difficulty: string) => {
    setSelectedDifficulty(difficulty);
  };

  // Filter exercises based on selected difficulty
  const filteredExercises = exercises.filter(exercise => {
    if (selectedDifficulty === 'all') return true;
    
    // Normalize difficulty values for comparison
    const exerciseDifficulty = String(exercise.difficulty || '').toLowerCase();
    const filterDifficulty = selectedDifficulty.toLowerCase();
    
    return exerciseDifficulty === filterDifficulty;
  });

  if (loading) {
    return (
      <div className="exercises-list-container">
        <Loader 
          size="large" 
          color="primary" 
          context="exercise"
          fullScreen={true}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="exercises-list-container">
        <div className="error-container">
          <h3>Error</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {selectedExercise ? (
        <div className="exercise-viewer-fullscreen">
          <ExerciseViewer
            exercise={selectedExercise}
            onBack={handleCloseViewer}
            exerciseIndex={exercises.findIndex(ex => ex.id === selectedExercise.id)}
          />
        </div>
      ) : (
        <div className="exercises-list-container">
          <div className="exercises-header">
            <button 
              onClick={handleBackToChapters} 
              className="back-btn"
            >
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
              {t('exercises.backToChapters')}
            </button>
            
            <div className="header-content">
              <h1>{chapterTitle}</h1>
              <p>{t('exercises.subtitle')}</p>
            </div>
            <Cap className="exercises-list-cap" />
          </div>

          {/* Difficulty Filters */}
          <div className="difficulty-filters">
            <div className="filters-container">
              <span className="filters-label">{t('exercises.filterByDifficulty')}:</span>
              <div className="filter-buttons">
                <button
                  className={`filter-btn ${selectedDifficulty === 'all' ? 'active' : ''}`}
                  onClick={() => handleDifficultyFilter('all')}
                >
                  {t('exercises.all')} ({exercises.length})
                </button>
                <button
                  className={`filter-btn easy ${selectedDifficulty === 'easy' ? 'active' : ''}`}
                  onClick={() => handleDifficultyFilter('easy')}
                >
                  {t('exercises.easy')} ({exercises.filter(ex => String(ex.difficulty || '').toLowerCase() === 'easy').length})
                </button>
                <button
                  className={`filter-btn medium ${selectedDifficulty === 'medium' ? 'active' : ''}`}
                  onClick={() => handleDifficultyFilter('medium')}
                >
                  {t('exercises.medium')} ({exercises.filter(ex => String(ex.difficulty || '').toLowerCase() === 'medium').length})
                </button>
                <button
                  className={`filter-btn hard ${selectedDifficulty === 'hard' ? 'active' : ''}`}
                  onClick={() => handleDifficultyFilter('hard')}
                >
                  {t('exercises.hard')} ({exercises.filter(ex => String(ex.difficulty || '').toLowerCase() === 'hard').length})
                </button>
              </div>
            </div>
          </div>

          <div className="exercises-grid">
            {filteredExercises.map((exercise, index) => {
              // Check if user has access to this exercise
              const hasAccess = accessibleExercises.includes(exercise.id);
              const isPremium = !hasAccess; // Premium if user doesn't have access

              return (
                <ExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  onClick={handleExerciseClick}
                  isPremium={isPremium}
                  hasAccess={hasAccess}
                />
              );
            })}
            {filteredExercises.length === 0 && (
              <div className="no-exercises-message">
                <p>{t('exercises.noExercisesFound')}</p>
              </div>
            )}
          </div>
        </div>
      )}

      <PremiumModal
        isOpen={showPremiumModal}
        onClose={handleClosePremiumModal}
        onContactAdmin={handleContactAdmin}
      />
    </>
  );
};

export default ExercisesList;