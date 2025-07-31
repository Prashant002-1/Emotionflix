/**
 * EMOTION TO GENRE MAPPING UTILITY
 *   Logic for mapping detected emotions to movie genres
 */

import { EmotionScores } from '../types/emotion';

/**
 * Basic emotion-to-genre mappings based on psychological associations
 * These will be refined as we gather more data and user feedback
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
 * NAME
 *   MapEmotionsToGenres - Converts emotion scores to weighted genre recommendations
 *
 * SYNOPSIS
 *   MapEmotionsToGenres(a_emotionScores: EmotionScores): number[]
 *     a_emotionScores: The detected or manually input emotion scores
 *
 * DESCRIPTION
 *   Analyzes emotion scores and maps them to TMDB genre IDs based on
 *   psychological associations. Returns sorted array of genre IDs
 *   weighted by emotion intensity.
 *
 * RETURNS
 *   Array of genre IDs sorted by relevance to emotional state
 */
export const MapEmotionsToGenres = (a_emotionScores: EmotionScores): number[] => {
  const genreWeights: Record<number, number> = {};

  // Calculate weighted genre scores based on emotion intensities
  Object.entries(a_emotionScores).forEach(([emotion, intensity]) => {
    if (intensity > 0.01) { // Lower threshold for broader genre matching
      const genreIds = EMOTION_GENRE_MAP[emotion as keyof typeof EMOTION_GENRE_MAP];
      genreIds?.forEach(genreId => {
        // Apply exponential weighting to amplify stronger emotions
        const amplifiedWeight = Math.pow(intensity, 0.7) * 2; // Amplify by factor of 2 with exponential scaling
        genreWeights[genreId] = (genreWeights[genreId] || 0) + amplifiedWeight;
      });
    }
  });

  // Sort genres by weight and return top matches
  return Object.entries(genreWeights)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5) // Top 5 genres
    .map(([genreId]) => parseInt(genreId));
};

/**
 * NAME
 *   GetEmotionDescription - Provides human-readable emotion summary
 *
 * SYNOPSIS
 *   GetEmotionDescription(a_emotionScores: EmotionScores): string
 *     a_emotionScores: The emotion scores to describe
 *
 * DESCRIPTION
 *   Analyzes emotion scores and returns a descriptive text
 *   explaining the detected emotional state for user feedback.
 *
 * RETURNS
 *   Human-readable description of the emotional state
 */
export const GetEmotionDescription = (a_emotionScores: EmotionScores): string => {
  const dominantEmotion = Object.entries(a_emotionScores).reduce((a, b) => 
    a_emotionScores[a[0] as keyof EmotionScores] > a_emotionScores[b[0] as keyof EmotionScores] ? a : b
  );

  const [emotion, intensity] = dominantEmotion;
  const intensityLevel = intensity > 0.7 ? 'very' : intensity > 0.4 ? 'somewhat' : 'slightly';

  return `You appear to be ${intensityLevel} ${emotion}`;
};