/**
 * Emotion Type Definitions
 * 
 * Type definitions for reviewed emotional records.
 * The current seven-key shape is a prototype constraint, not the final product vocabulary.
 */

/**
 * Reviewed emotional values entered directly by the person.
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
