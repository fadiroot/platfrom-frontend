import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ExerciseState, Exercise } from './exerciseTypes';
import { fetchExercisesBySubject, createNewExercise } from './exerciseThunk';

const initialState: ExerciseState = {
  exercises: [],
  loading: false,
  error: null,
};

const exerciseSlice = createSlice({
  name: 'exercises',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchExercisesBySubject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExercisesBySubject.fulfilled, (state, action: PayloadAction<Exercise[]>) => {
        state.exercises = action.payload;
        state.loading = false;
      })
      .addCase(fetchExercisesBySubject.rejected, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createNewExercise.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createNewExercise.fulfilled, (state, action: PayloadAction<Exercise>) => {
        state.exercises.push(action.payload);
        state.loading = false;
      })
      .addCase(createNewExercise.rejected, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default exerciseSlice.reducer; 