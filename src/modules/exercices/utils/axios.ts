import axios from 'axios';

// Base URL for the backend API
const API_BASE_URL = 'http://localhost:5234/api/exercises';

// POST /api/exercises - Create a new exercise
export const createExercise = async (exerciseData: any) => {
  const response = await axios.post(`${API_BASE_URL}`, exerciseData);
  return response.data;
};

// GET /api/exercises/by-subject/{subjectId} - Get exercises by subjectId
export const getExercisesBySubject = async (subjectId: string) => {
  const response = await axios.get(`${API_BASE_URL}/by-chapter/${subjectId}`);
  return response.data;
}; 