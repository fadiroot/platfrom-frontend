import type { Exercise } from '../types/exercise';
export type { Exercise } from '../types/exercise';

export interface ExerciseState {
  exercises: Exercise[];
  loading: boolean;
  error: string | null;
} 