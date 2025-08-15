export interface Exercise {
  id: string;
  code?: string;
  name: string;
  tag: number;
  difficulty?: string;
  exerciseFileUrls?: string[];
  correctionFileUrls?: string[];
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
