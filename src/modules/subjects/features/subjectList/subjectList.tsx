import React, { useEffect, useState } from 'react';
import './index.scss';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

// Define the Subject interface
interface Subject {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  levelId?: string;
}

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const SubjectList: React.FC = () => {
  const navigate = useNavigate();
  const query = useQuery();
  const levelId = query.get('levelId');

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!levelId) return;
    setLoading(true);
    setError(null);
    axios
      .get(`http://localhost:5234/api/subjects/by-level/${levelId}`)
      .then((res) => setSubjects(res.data))
      .catch((err) => setError(err.message || 'Failed to fetch subjects'))
      .finally(() => setLoading(false));
  }, [levelId]);

  const handleSubjectClick = (subjectId: string) => {
    navigate(`/subjects/${subjectId}/chapters`);
  };

  if (!levelId) {
    return <div style={{ padding: 32 }}>No level selected.</div>;
  }

  if (loading) {
    return <div style={{ padding: 32 }}>Loading...</div>;
  }

  if (error) {
    return <div style={{ padding: 32, color: 'red' }}>Error: {error}</div>;
  }

  return (
    <div className="subject-list-container">
      <h1 className="subject-list-title">Subjects for Selected Level</h1>
      <p className="subject-list-subtitle">Select a subject to start your learning journey</p>
      
      <div className="subject-grid">
        {subjects.length === 0 && <div>No subjects found for this level.</div>}
        {subjects.map((subject) => (
          <div 
            className="subject-card" 
            key={subject.id}
            onClick={() => handleSubjectClick(subject.id)}
          >
            <div className="subject-icon">📘</div>
            <h2 className="subject-name">{subject.title}</h2>
            <p className="subject-description">{subject.description}</p>
            <div className="subject-meta">
              <button className="explore-button">Explore</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SubjectList;