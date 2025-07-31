/**
 * TYPE DEFINITIONS
 *   Emotion-related type definitions for face-api.js integration
 */

export interface EmotionScores {
  neutral: number;
  happy: number;
  sad: number;
  angry: number;
  fearful: number;
  disgusted: number;
  surprised: number;
}

export interface EmotionSession {
  id: string;
  type: 'webcam' | 'manual' | 'upload';
  emotionScores: EmotionScores;
  confidence: number;
  timestamp: Date;
}

export interface EmotionToGenreMapping {
  emotion: keyof EmotionScores;
  genreIds: number[];
  weight: number;
}

export interface WatchedMovie {
  movieId: number;
  userId: string;
  watchedAt: Date;
  emotions?: EmotionScores;
  hasLoggedEmotion: boolean;
  // Movie details for UI display
  title: string;
  poster_path: string | null;
  release_date: string;
  vote_average: number;
  genre_ids: number[];
}