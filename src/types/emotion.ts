/**
 * Emotion Type Definitions
 * 
 * Type definitions for emotion detection, scoring, and mapping functionality.
 * These types support face-api.js integration and emotion-based movie recommendations.
 */

/**
 * Emotion scores detected by face-api.js or entered manually.
 * All values are normalized between 0 and 1, representing the intensity of each emotion.
 */
export interface EmotionScores {
  /** Neutral emotional state (0-1) */
  neutral: number;
  /** Happy/joyful emotional state (0-1) */
  happy: number;
  /** Sad emotional state (0-1) */
  sad: number;
  /** Angry emotional state (0-1) */
  angry: number;
  /** Fearful/scared emotional state (0-1) */
  fearful: number;
  /** Disgusted emotional state (0-1) */
  disgusted: number;
  /** Surprised emotional state (0-1) */
  surprised: number;
}

/**
 * Records a single emotion detection session with metadata.
 * Tracks how emotions were captured and when they were detected.
 */
export interface EmotionSession {
  /** Unique identifier for the session */
  id: string;
  /** Method used to detect emotions */
  type: 'webcam' | 'manual' | 'upload';
  /** The detected or entered emotion scores */
  emotionScores: EmotionScores;
  /** Confidence level of the detection (0-1), 1.0 for manual input */
  confidence: number;
  /** When the emotion session was recorded */
  timestamp: Date;
}

/**
 * Maps emotions to movie genres for recommendation algorithms.
 * Defines how specific emotions correlate with movie genre preferences.
 */
export interface EmotionToGenreMapping {
  /** The emotion being mapped */
  emotion: keyof EmotionScores;
  /** Array of TMDB genre IDs associated with this emotion */
  genreIds: number[];
  /** Weight/strength of the emotion-to-genre relationship (0-1) */
  weight: number;
}

/**
 * Represents a movie that a user has watched, with emotion data and metadata.
 * Combines user interaction data with movie details for display purposes.
 */
export interface WatchedMovie {
  /** TMDB movie ID */
  movieId: number;
  /** ID of the user who watched the movie */
  userId: string;
  /** When the user watched the movie */
  watchedAt: Date;
  /** Optional emotion scores associated with watching this movie */
  emotions?: EmotionScores;
  /** Whether the user has logged emotions for this movie */
  hasLoggedEmotion: boolean;
  /** Movie title for display */
  title: string;
  /** TMDB poster image path */
  poster_path: string | null;
  /** Movie release date in YYYY-MM-DD format */
  release_date: string;
  /** TMDB average rating (0-10) */
  vote_average: number;
  /** Array of TMDB genre IDs */
  genre_ids: number[];
}