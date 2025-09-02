/**
 * Emotion Mapping Utilities
 * 
 * Utilities for mapping detected emotions to movie genres and generating
 * human-readable emotion descriptions. Uses probable psychological associations
 * between emotional states and movie genre preferences.
 */

import { EmotionScores } from '../types/emotion';

/**
 * Emotion-to-genre mappings based on psychological associations.
 * Maps each emotion type to relevant TMDB genre IDs.
 * These mappings are refined based on user feedback and data analysis.
 */
const EMOTION_GENRE_MAP = {
  happy: [35, 16, 10402], // Comedy, Animation, Music
  sad: [18, 10749], // Drama, Romance
  angry: [28, 80, 53], // Action, Crime, Thriller
  fearful: [27, 53, 9648], // Horror, Thriller, Mystery
  surprised: [878, 14, 9648], // Sci-Fi, Fantasy, Mystery
  disgusted: [27, 80], // Horror, Crime
  neutral: [18, 28, 35], // Drama, Action, Comedy
};

/**
 * Converts emotion scores to weighted genre recommendations.
 * Analyzes emotion scores and maps them to TMDB genre IDs based on
 * psychological associations, with exponential weighting for stronger emotions.
 * 
 * @param emotionScores - The detected or manually input emotion scores
 * @returns Array of top 5 genre IDs sorted by relevance to emotional state
 */
export const MapEmotionsToGenres = (emotionScores: EmotionScores): number[] => {
  const genreWeights: Record<number, number> = {};

  // Calculate weighted genre scores based on emotion intensities
  Object.entries(emotionScores).forEach(([emotion, intensity]) => {
    // Lower threshold for broader genre matching
    if (intensity > 0.01) { 
      const genreIds = EMOTION_GENRE_MAP[emotion as keyof typeof EMOTION_GENRE_MAP];
      genreIds?.forEach(genreId => {
        // Apply exponential weighting to amplify stronger emotions
        const amplifiedWeight = Math.pow(intensity, 0.7) * 2; 
        genreWeights[genreId] = (genreWeights[genreId] || 0) + amplifiedWeight;
      });
    }
  });

  // Sort genres by weight and return top matches
  return Object.entries(genreWeights)
    .sort(([, a], [, b]) => b - a)
    // Top 5 genres
    .slice(0, 5) 
    .map(([genreId]) => parseInt(genreId));
};

/**
 * Provides a readable description of the dominant emotional state.
 * Analyzes emotion scores and returns descriptive text explaining
 * the detected emotional state.
 * 
 * @param emotionScores - The emotion scores to analyze and describe
 * @returns Readable description of the emotional state
 */
export const GetEmotionDescription = (emotionScores: EmotionScores): string => {
  const dominantEmotion = Object.entries(emotionScores).reduce((a, b) => 
    emotionScores[a[0] as keyof EmotionScores] > emotionScores[b[0] as keyof EmotionScores] ? a : b
  );

  const [emotion, intensity] = dominantEmotion;
  const intensityLevel = intensity > 0.7 ? 'very' : intensity > 0.4 ? 'somewhat' : 'slightly';

  return `You appear to be ${intensityLevel} ${emotion}`;
};