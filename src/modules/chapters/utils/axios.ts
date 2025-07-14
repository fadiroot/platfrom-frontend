import axios from 'axios';

// Base URL for the backend API
const API_BASE_URL = 'http://localhost:5234/api/chapters';

// GET /api/chapters/by-subject/{subjectId} - Get chapters by subjectId
export const getChaptersBySubject = async (subjectId: string) => {
  const response = await axios.get(`${API_BASE_URL}/by-subject/${subjectId}`);
  return response.data;
}; 