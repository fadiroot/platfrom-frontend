import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Level, LevelState } from './levelTypes';
import { fetchLevels } from './levelThunk';

const initialState: LevelState = {
  levels: [],
  loading: false,
  error: null,
};

const levelSlice = createSlice({
  name: 'levels',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchLevels.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchLevels.fulfilled, (state, action: PayloadAction<Level[]>) => {
      state.levels = action.payload;
      state.loading = false;
    });
    builder.addCase(fetchLevels.rejected, (state, action: PayloadAction<any>) => {
      state.loading = false;
      state.error = action.payload;
    });
  },
});

export default levelSlice.reducer; 