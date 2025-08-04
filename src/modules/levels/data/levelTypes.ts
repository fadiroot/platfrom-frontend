export interface Level {
    id: string;
    title: string;
    description: string | null;
    created_at: string;
    updated_at: string;
  }
  
  export interface LevelState {
    levels: Level[];
    loading: boolean;
    error: string | null;
  } 