/**
 * User Movies Service
 * 
 * Service for managing user movie interactions including watchlist,
 * watch history, ratings, and emotion data. Handles CRUD operations
 * for user movie relationships and statistics.
 */

import apiClient from './apiClient';
import { Movie } from '../types/movie';
import { EmotionScores } from '../types/emotion';

/**
 * User movie interaction record combining movie data with user status.
 * Represents a movie in user's watchlist or watch history with optional emotion data.
 */
export interface UserMovie {
  /** Unique record ID */
  id: number;
  /** User ID who owns this record */
  user_id: number;
  /** TMDB movie ID */
  movie_id: number;
  /** Current status of movie for user */
  status: 'watchlist' | 'watched';
  /** Optional user rating (1-10) */
  rating?: number;
  /** When record was created */
  created_at: string;
  /** Movie title */
  title: string;
  /** TMDB poster path */
  poster_path: string | null;
  /** Movie release date */
  release_date: string;
  /** TMDB average rating */
  vote_average: number;
  /** Movie overview/description */
  overview: string;
  /** Optional emotion data - only present if emotions were logged */
  neutral?: number;
  happy?: number;
  sad?: number;
  angry?: number;
  fearful?: number;
  disgusted?: number;
  surprised?: number;
  confidence?: number;
  detection_method?: string;
  emotion_created_at?: string;
}

/**
 * User statistics aggregated from movie interactions and emotion data.
 */
export interface UserStats {
  /** Movie-related statistics */
  movies: {
    /** Number of movies in watchlist */
    watchlist: number;
    /** Number of movies watched */
    watched: number;
    /** Total number of movie interactions */
    total: number;
  };
  /** Emotion-related statistics */
  emotions: {
    /** Total number of emotion logs */
    total: number;
    /** Average confidence score across all emotion detections */
    averageConfidence: number;
    /** User's most frequently detected emotion */
    favoriteEmotion: string;
  };
}

/**
 * Converts UserMovie emotion data to EmotionScores format.
 * Helper function to extract emotion data from database records.
 * 
 * @param movie - UserMovie record with optional emotion data
 * @returns EmotionScores object or null if no emotion data present
 */
export const convertToEmotionScores = (movie: UserMovie): EmotionScores | null => {
  if (!movie.neutral && !movie.happy && !movie.sad && !movie.angry && 
      !movie.fearful && !movie.disgusted && !movie.surprised) {
    return null;
  }
  
  return {
    neutral: movie.neutral || 0,
    happy: movie.happy || 0,
    sad: movie.sad || 0,
    angry: movie.angry || 0,
    fearful: movie.fearful || 0,
    disgusted: movie.disgusted || 0,
    surprised: movie.surprised || 0
  };
};

export const userMoviesService = {
  async getUserMovies(status?: string): Promise<UserMovie[]> {
    const params = status ? { status } : {};
    const response = await apiClient.get('/user-movies', { params });
    return response.data.movies;
  },

  async addToWatchlist(movie: Movie, emotions?: EmotionScores): Promise<UserMovie> {
    const response = await apiClient.post('/user-movies', {
      movieId: movie.id,
      status: 'watchlist',
      emotions
    });
    return response.data.movie;
  },



  async markAsWatched(movie: Movie, emotions?: EmotionScores, rating?: number, confidence?: number): Promise<UserMovie> {
    const response = await apiClient.post('/user-movies', {
      movieId: movie.id,
      status: 'watched',
      rating,
      emotions,
      confidence
    });
    return response.data.movie;
  },

  async updateMovie(movieId: number, updates: { status?: string; rating?: number }): Promise<UserMovie> {
    const response = await apiClient.put(`/user-movies/${movieId}`, updates);
    return response.data.movie;
  },

  async removeMovie(movieId: number, status: string): Promise<void> {
    await apiClient.delete(`/user-movies/${movieId}?status=${status}`);
  },

  async getUserStats(): Promise<UserStats> {
    const response = await apiClient.get('/user-movies/stats');
    return response.data;
  },

  async getUserEmotionalProfile(): Promise<EmotionScores> {
    const response = await apiClient.get('/user-movies/emotional-profile');
    return response.data;
  },

  async isInUserList(movieId: number, status?: string): Promise<boolean> {
    try {
      const params = status ? { status } : {};
      const response = await apiClient.get('/user-movies', { params });
      return response.data.movies.some((movie: UserMovie) => movie.movie_id === movieId);
    } catch (error) {
      return false;
    }
  }
};
