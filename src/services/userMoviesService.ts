// src/services/userMoviesService.ts - Service for user movie management

import apiClient from './apiClient';
import { Movie } from '../types/movie';
import { EmotionScores } from '../types/emotion';

export interface UserMovie {
  id: number;
  user_id: number;
  movie_id: number;
  status: 'watchlist' | 'watched';
  rating?: number;
  created_at: string;
  title: string;
  poster_path: string | null;
  release_date: string;
  vote_average: number;
  overview: string;
  // Emotion data (optional - only present if emotions were logged)
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

export interface UserStats {
  movies: {
    watchlist: number;
    watched: number;
    total: number;
  };
  emotions: {
    total: number;
    averageConfidence: number;
    favoriteEmotion: string;
  };
}

// Helper function to convert UserMovie emotion data to EmotionScores
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
