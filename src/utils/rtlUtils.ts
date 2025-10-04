import { useTranslation } from 'react-i18next';

/**
 * Utility function to get RTL-aware placeholder text
 * @param key - Translation key for the placeholder
 * @param fallback - Fallback text if translation is not available
 * @param isRTL - Whether the current language is RTL (Arabic)
 * @returns RTL-aware placeholder text
 */
export const getRTLPlaceholder = (key: string, fallback: string, isRTL: boolean = false): string => {
  // For now, return the fallback text
  // In the future, this can be enhanced to use translation keys
  return fallback;
};

/**
 * Hook to get RTL-aware placeholder text with translation support
 * @param key - Translation key for the placeholder
 * @param fallback - Fallback text if translation is not available
 * @returns RTL-aware placeholder text
 */
export const useRTLPlaceholder = (key: string, fallback: string): string => {
  const { i18n } = useTranslation();
  const isRTL = i18n?.language === 'ar';
  
  // For now, return the fallback text
  // In the future, this can be enhanced to use translation keys
  return fallback;
};

/**
 * Get RTL-aware placeholder text for common dashboard elements
 */
export const getDashboardPlaceholders = (isRTL: boolean = false) => {
  const placeholders = {
    // French placeholders (current)
    allLevels: "Tous les niveaux",
    allSubjects: "Toutes les matières",
    searchExercises: "Rechercher par nom d'exercice...",
    searchExercisesSimple: "Search exercises...",
    filterByLevel: "Filtrer par niveau",
    filterBySubject: "Filtrer par matière",
    filterByChapter: "Filtrer par chapitre",
    filterByDifficulty: "Filtrer par difficulté",
    selectLevel: "Sélectionner un niveau",
    selectSubject: "Sélectionner une matière",
    selectChapter: "Sélectionner un chapitre",
    selectDifficulty: "Sélectionner la difficulté",
    subjectTitle: "Ex: Algorithmique et Programmation",
    chapterTitle: "Ex: Arrays and Lists",
    subjectDescription: "Description de la matière...",
    chapterDescription: "Description du chapitre...",
    imageUrl: "https://example.com/image.jpg",
    exerciseName: "Ex: Algorithme de Tri à Bulles",
    selectSubjectFirst: "Sélectionnez d'abord un niveau",
    
    // Arabic placeholders (for RTL)
    allLevelsAR: "جميع المستويات",
    allSubjectsAR: "جميع المواد",
    searchExercisesAR: "البحث عن التمارين...",
    searchExercisesSimpleAR: "البحث عن التمارين...",
    filterByLevelAR: "تصفية حسب المستوى",
    filterBySubjectAR: "تصفية حسب المادة",
    filterByChapterAR: "تصفية حسب الفصل",
    filterByDifficultyAR: "تصفية حسب الصعوبة",
    selectLevelAR: "اختر مستوى",
    selectSubjectAR: "اختر مادة",
    selectChapterAR: "اختر فصلاً",
    selectDifficultyAR: "اختر الصعوبة",
    subjectTitleAR: "مثال: الخوارزميات والبرمجة",
    chapterTitleAR: "مثال: المصفوفات والقوائم",
    subjectDescriptionAR: "وصف المادة...",
    chapterDescriptionAR: "وصف الفصل...",
    imageUrlAR: "https://example.com/image.jpg",
    exerciseNameAR: "مثال: خوارزمية الترتيب الفقاعي",
    selectSubjectFirstAR: "اختر مستوى أولاً",
  };

  if (isRTL) {
    return {
      allLevels: placeholders.allLevelsAR,
      allSubjects: placeholders.allSubjectsAR,
      searchExercises: placeholders.searchExercisesAR,
      searchExercisesSimple: placeholders.searchExercisesSimpleAR,
      filterByLevel: placeholders.filterByLevelAR,
      filterBySubject: placeholders.filterBySubjectAR,
      filterByChapter: placeholders.filterByChapterAR,
      filterByDifficulty: placeholders.filterByDifficultyAR,
      selectLevel: placeholders.selectLevelAR,
      selectSubject: placeholders.selectSubjectAR,
      selectChapter: placeholders.selectChapterAR,
      selectDifficulty: placeholders.selectDifficultyAR,
      subjectTitle: placeholders.subjectTitleAR,
      chapterTitle: placeholders.chapterTitleAR,
      subjectDescription: placeholders.subjectDescriptionAR,
      chapterDescription: placeholders.chapterDescriptionAR,
      imageUrl: placeholders.imageUrlAR,
      exerciseName: placeholders.exerciseNameAR,
      selectSubjectFirst: placeholders.selectSubjectFirstAR,
    };
  }

  return placeholders;
};
