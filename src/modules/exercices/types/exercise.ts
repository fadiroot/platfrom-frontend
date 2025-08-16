export interface Exercise {
  completed: any;
  id: string;
  name: string;
  tag: number;
  difficulty: string | number;
  subjectId: string;
  exerciseFileUrls: string[];
  correctionFileUrls: string[];
}