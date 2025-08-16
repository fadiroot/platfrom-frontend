export interface Exercise {
  id: string;
  code?: string;
  name: string;
  tag: number;
  difficulty: string | number;
  exerciseFileUrls?: string[];
  correctionFileUrls?: string[];
  completed?: any;
  subjectId?: string;
  chapterId?: string;
}

export interface ExerciseViewerProps {
  exercise: Exercise;
  onBack: () => void;
  exerciseIndex?: number;
}

export interface PDFViewerProps {
  url: string;
  onLoad?: () => void;
  onError?: (error: string) => void;
}
