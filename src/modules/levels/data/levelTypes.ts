export interface Level {
    id: string;
    title: string;
    description: string;
    createdAt: string;
  }
  
  export interface LevelState {
    levels: Level[];
    loading: boolean;
    error: string | null;
  } 