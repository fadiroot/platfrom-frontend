import React, { useEffect, useState } from 'react';
import './index.scss';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getSubjects } from '@/lib/api/subjects';

// Define the Subject interface
interface Subject {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  level_id: string | null;
}

const SubjectList: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('translation');

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    
    const fetchSubjects = async () => {
      try {
        const subjects = await getSubjects();
        setSubjects(subjects);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch subjects');
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, []);

  const handleSubjectClick = (subjectId: string) => {
    navigate(`/subjects/${subjectId}/chapters`);
  };

  if (loading) {
    return <div style={{ padding: 32 }}>Loading...</div>;
  }

  if (error) {
    return <div style={{ padding: 32, color: 'red' }}>Error: {error}</div>;
  }

  return (
    <div className="subject-list-container">
      <h1 className="subject-list-title">{t('subjects.title')}</h1>
      <p className="subject-list-subtitle">{t('subjects.subtitle')}</p>
      
      <div className="subject-grid">
        {subjects.length === 0 && <div>{t('subjects.noSubjects')}</div>}
        {subjects.map((subject) => (
          <div 
            className="subject-card" 
            key={subject.id}
            onClick={() => handleSubjectClick(subject.id)}
          >
            <div className="subject-icon">📘</div>
            <h2 className="subject-name">{subject.title}</h2>
            <p className="subject-description">{subject.description || t('subjects.noDescription')}</p>
            <div className="subject-meta">
              <button className="explore-button">{t('subjects.explore')}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SubjectList;