import React, { useEffect, useState } from 'react';
import './index.scss';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../../modules/shared/store';
import { fetchLevels } from '../../data/levelThunk';
import axiosInstance from '../../utils/axios';

// Define the Level interface to match the API response
interface Level {
  id: string;
  title: string;
  description: string;
}

interface Chapter {
  id: string;
  title: string;
}

const LevelsList: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { levels, loading, error } = useAppSelector((state) => state.levels);

  const [selectedLevelId, setSelectedLevelId] = useState<string | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [chaptersLoading, setChaptersLoading] = useState(false);
  const [chaptersError, setChaptersError] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchLevels());
  }, [dispatch]);

  const handleLevelClick = (levelId: string) => {
    setSelectedLevelId(levelId);
  };

  const handleContinue = () => {
    if (selectedLevelId) {
      navigate(`/levels/${selectedLevelId}/subjects`);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="level-list-container-vertical">
      <h1 className="level-list-title">Select Your Class</h1>
      <p className="level-list-subtitle">Choose your current grade to get started.</p>
      <form className="level-list-radio-form" onSubmit={e => { e.preventDefault(); handleContinue(); }}>
        <div className="level-list-radio-group">
          {levels.map((level) => (
            <label key={level.id} className="level-radio-label">
              <input
                type="radio"
                name="level"
                value={level.id}
                checked={selectedLevelId === level.id}
                onChange={() => handleLevelClick(level.id)}
              />
              <span className="level-radio-title">{level.title}</span>
              <span className="level-radio-description">{level.description}</span>
            </label>
          ))}
        </div>
        <button type="submit" className="explore-button" disabled={!selectedLevelId}>
          Continue
        </button>
      </form>
    </div>
  );
};

export default LevelsList; 