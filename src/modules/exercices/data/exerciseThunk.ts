import { createAsyncThunk } from '@reduxjs/toolkit';
import { getExercisesBySubject, createExercise } from '../utils/axios';
import { Exercise } from '../types/exercise';

// Fetch exercises by subjectId
export const fetchExercisesBySubject = createAsyncThunk<Exercise[], string, { rejectValue: string }>(
  'exercises/fetchBySubject',
  async (subjectId, { rejectWithValue }) => {
    try {
      const data = await getExercisesBySubject(subjectId);
      return data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Create a new exercise
export const createNewExercise = createAsyncThunk<Exercise, any, { rejectValue: string }>(
  'exercises/create',
  async (exerciseData, { rejectWithValue }) => {
    try {
      const data = await createExercise(exerciseData);
      return data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
); 