import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './index.scss';
import ExerciseCard from '../../components/ExerciseCard/ExerciseCard';
import ExerciseViewer from '../../components/ExerciseViewer/ExerciseViewer';
import { Exercise } from '../../types/exercise';
import { getExercisesBySubject } from '../../utils/axios';

const ExercisesList: React.FC = () => {
  const { chapterId, subjectId } = useParams<{ chapterId: string, subjectId: string }>();
  const navigate = useNavigate();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [chapterTitle, setChapterTitle] = useState<string>('');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [showCorrection, setShowCorrection] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (chapterId) {
      setLoading(true);
      setError(null);
      getExercisesBySubject(chapterId)
        .then((data) => {
          setExercises(data);
          // Optionally set chapter title if returned by API
        })
        .catch((err) => setError(err.message || 'Failed to fetch exercises'))
        .finally(() => setLoading(false));
      // Set chapter title based on ID (fallback)
      const chapterTitles: Record<string, string> = {
        '101': 'Algebra Fundamentals',
        '102': 'Geometry and Trigonometry',
        '103': 'Calculus I: Limits and Derivatives',
        '201': 'Mechanics: Motion and Forces',
        '202': 'Thermodynamics',
        '301': 'Introduction to Programming'
      };
      setChapterTitle(chapterTitles[chapterId] || 'Chapter');
    }
  }, [chapterId]);
  
  const handleExerciseClick = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setShowCorrection(false);
  };
  
  const handleCloseExercise = () => {
    setSelectedExercise(null);
    setShowCorrection(false);
  };
  
  const toggleExerciseCompletion = (exerciseId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setExercises(exercises.map(ex => 
      ex.id === exerciseId ? { ...ex, completed: !ex.completed } : ex
    ));
    
    // In a real app, you would send this update to your backend
    console.log(`Exercise ${exerciseId} marked as ${!exercises.find(ex => ex.id === exerciseId)?.completed ? 'completed' : 'incomplete'}`);
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
              ← Back to Chapters
            </button>
            <h1 className="exercises-list-title">{chapterTitle} Exercises</h1>
            <p className="exercises-list-subtitle">Select an exercise to practice your skills</p>
          </div>
          {loading ? (
            <div style={{ padding: 32 }}>Loading...</div>
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