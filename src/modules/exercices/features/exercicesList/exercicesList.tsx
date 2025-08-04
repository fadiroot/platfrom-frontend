import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './index.scss';
import ExerciseCard from '../../components/ExerciseCard/ExerciseCard';
import ExerciseViewer from '../../components/ExerciseViewer/ExerciseViewer';
import { getExercisesByChapter } from '@/lib/api/exercises';
import { getChapterById } from '@/lib/api/chapters';
import type { Exercise as SupabaseExercise } from '@/lib/api/exercises';
import { Exercise } from '../../types/exercise';

const ExercisesList: React.FC = () => {
  const { chapterId, subjectId } = useParams<{ chapterId: string, subjectId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('translation');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [chapterTitle, setChapterTitle] = useState<string>('');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Map Supabase exercise data to local Exercise format
  const mapSupabaseToLocalExercise = (supabaseExercise: SupabaseExercise): Exercise => {
    const difficultyToTag = (difficulty: string | null): number => {
      switch (difficulty?.toLowerCase()) {
        case 'easy': return 0;
        case 'medium': return 1;
        case 'hard': return 2;
        default: return 0;
      }
    };

    return {
      id: supabaseExercise.id,
      name: supabaseExercise.name || '',
      tag: difficultyToTag(supabaseExercise.difficulty),
      subjectId: supabaseExercise.chapter_id || '', // Note: This is actually chapter_id but keeping for compatibility
      exerciseFileUrls: supabaseExercise.exercise_file_urls || [],
      correctionFileUrls: supabaseExercise.correction_file_urls || [],
      completed: false // Default value - in real app, this would come from user progress
    };
  };
  
  useEffect(() => {
    if (chapterId) {
      setLoading(true);
      setError(null);
      
      // Fetch both exercises and chapter data
      Promise.all([
        getExercisesByChapter(chapterId),
        getChapterById(chapterId)
      ])
        .then(([exercisesData, chapterData]) => {
          const mappedExercises = exercisesData.map(mapSupabaseToLocalExercise);
          setExercises(mappedExercises);
          
          // Set the actual chapter title from the database
          if (chapterData) {
            setChapterTitle(chapterData.title || 'Chapter');
          } else {
            setChapterTitle('Chapter');
          }
        })
        .catch((err) => {
          setError(err.message || 'Failed to fetch data');
          // Fallback chapter title in case of error
          setChapterTitle('Chapter');
        })
        .finally(() => setLoading(false));
    }
  }, [chapterId]);
  
  const handleExerciseClick = (exercise: Exercise) => {
    setSelectedExercise(exercise);
  };
  
  const handleCloseExercise = () => {
    setSelectedExercise(null);
  };
  
  return (
    <div className="exercises-list-container">
      {!selectedExercise ? (
        <>
          <div className="exercises-list-header">
            <button 
              className="back-button"
              onClick={() => navigate(`/subjects/${subjectId}/chapters`)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m15 18-6-6 6-6" />
              </svg>
              {t('exercises.backToChapters')}
            </button>

            <div className="header-content">
              <h1 className="exercises-list-title">{chapterTitle} - {t('exercises.title')}</h1>
              <p className="exercises-list-subtitle">{t('exercises.subtitle')}</p>
            </div>
          </div>
          {loading ? (
            <div style={{ padding: 32 }}>{t('exercises.loading')}</div>
          ) : error ? (
            <div style={{ padding: 32, color: 'red' }}>Error: {error}</div>
          ) : (
            <div className="exercises-grid">
              {exercises.map((exercise) => (
                <ExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  onClick={handleExerciseClick}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <ExerciseViewer
          exercise={selectedExercise}
          onClose={handleCloseExercise}
        />
      )}
    </div>
  );
};

export default ExercisesList;