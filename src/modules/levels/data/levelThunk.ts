import { createAsyncThunk } from '@reduxjs/toolkit';
import { getLevels, getLevelById, createLevel, updateLevel, deleteLevel } from '../../../lib/api/levels';

export const fetchLevels = createAsyncThunk(
  'levels/fetchLevels',
  async (_, { rejectWithValue }) => {
    try {
      const levels = await getLevels();
      return levels;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch levels');
    }
  }
);

export const fetchLevelById = createAsyncThunk(
  'levels/fetchLevelById',
  async (levelId: string, { rejectWithValue }) => {
    try {
      const level = await getLevelById(levelId);
      return level;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch level');
    }
  }
);

export const createNewLevel = createAsyncThunk(
  'levels/createLevel',
  async (levelData: { title: string; description?: string }, { rejectWithValue }) => {
    try {
      const level = await createLevel({ ...levelData, description: levelData.description || null });
      return level;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to create level');
    }
  }
);

export const updateExistingLevel = createAsyncThunk(
  'levels/updateLevel',
  async ({ id, ...levelData }: { id: string; title?: string; description?: string }, { rejectWithValue }) => {
    try {
      const level = await updateLevel(id, levelData);
      return level;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to update level');
    }
  }
);

export const removeLevel = createAsyncThunk(
  'levels/deleteLevel',
  async (levelId: string, { rejectWithValue }) => {
    try {
      await deleteLevel(levelId);
      return levelId;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to delete level');
    }
  }
); 5