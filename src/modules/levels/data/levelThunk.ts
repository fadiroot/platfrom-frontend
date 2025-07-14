import { createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../utils/axios';

export const fetchLevels = createAsyncThunk(
  'levels/fetchLevels',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/api/levels');
      if (response.status === 200) {
        return response.data;
      }
      throw new Error(response.statusText);
    } catch (err: any) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
); 5