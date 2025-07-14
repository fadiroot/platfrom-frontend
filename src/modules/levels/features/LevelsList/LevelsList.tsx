import React, { useEffect, useState } from 'react';
import './index.scss';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@src/modules/shared/store';
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
    navigate(`/subjects?levelId=${levelId}`);
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
      
      <div className="level-list-vertical">
        {levels.map((level) => (
          <div key={level.id}>
            <div
              className="level-card-vertical"
              onClick={() => handleLevelClick(level.id)}
              style={{ border: selectedLevelId === level.id ? '2px solid #4a6bff' : undefined }}
            >
              <div className="level-info">
                <h2 className="level-name">{level.title}</h2>
                <p className="level-description">{level.description}</p>
              </div>
              <div className="level-meta">
                <button className="explore-button">Select</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LevelsList; 