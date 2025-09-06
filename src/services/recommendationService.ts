/**
 * Recommendation Service
 * 
 * Core recommendation engine that generates personalized movie suggestions
 * based on user emotions, preferences, and viewing history. Combines
 * emotion-to-genre mapping with collaborative filtering techniques.
 */

import { EmotionScores } from '../types/emotion';
import { Movie } from '../types/movie';
import { GetMoviesByGenres, GetMovieDetails } from './tmdbApi';
import { MapEmotionsToGenres } from '../utils/emotionMapping';
import { personalizedEmotionMappingService, PersonalizedMapping } from './personalizedEmotionMapping';

export interface RecommendationScore {
  movieId: number;
  score: number;
  reasons: string[];
}

export interface UserPreferences {
  favoriteGenres: number[];
  emotionWeights: EmotionScores;
  watchHistory: number[];
  ratings: { [movieId: number]: number };
}

class RecommendationService {
  async getEmotionBasedRecommendations(
    emotions: EmotionScores, 
    limit: number = 20,
    userPreferences?: UserPreferences,
    userId?: string
  ): Promise<Movie[]> {
    try {
      const genreIds = MapEmotionsToGenres(emotions);
      
      if (genreIds.length === 0) {
        return [];
      }

      const response = await GetMoviesByGenres(genreIds);
      let movies = response.results;

      if (userPreferences) {
        movies = await this.filterAndRankMovies(movies, emotions, userPreferences, userId);
      }

      return movies.slice(0, limit);
    } catch (error) {
      return [];
    }
  }

  async getPersonalizedRecommendations(
    _userId: string,
    userPreferences: UserPreferences,
    limit: number = 20
  ): Promise<Movie[]> {
    try {
      const favoriteGenres = userPreferences.favoriteGenres.slice(0, 3);
      
      if (favoriteGenres.length === 0) {
        return this.getPopularMovies(limit);
      }

      const response = await GetMoviesByGenres(favoriteGenres);
      let movies = response.results;

      movies = movies.filter(movie => 
        !userPreferences.watchHistory.includes(movie.id)
      );

      movies = this.rankByUserPreferences(movies, userPreferences);

      return movies.slice(0, limit);
    } catch (error) {
      return this.getPopularMovies(limit);
    }
  }

  async getSimilarMovies(movieId: number, limit: number = 10): Promise<Movie[]> {
    try {
      const movie = await GetMovieDetails(movieId);
      
      if (!movie || !movie.genres) {
        return [];
      }

      const genreIds = movie.genres.map(g => g.id);
      const response = await GetMoviesByGenres(genreIds);
      
      return response.results
        .filter(m => m.id !== movieId)
        .slice(0, limit);
    } catch (error) {
      return [];
    }
  }

  private async filterAndRankMovies(
    movies: Movie[], 
    emotions: EmotionScores, 
    userPreferences: UserPreferences,
    userId?: string
  ): Promise<Movie[]> {
    const filteredMovies = movies.filter(movie => !userPreferences.watchHistory.includes(movie.id));
    
    const scoredMovies = await Promise.all(
      filteredMovies.map(async movie => ({
        ...movie,
        recommendationScore: await this.calculateRecommendationScore(movie, emotions, userPreferences, userId)
      }))
    );
    
    return scoredMovies.sort((a, b) => (b as any).recommendationScore - (a as any).recommendationScore);
  }

  private rankByUserPreferences(movies: Movie[], userPreferences: UserPreferences): Movie[] {
    return movies
      .map(movie => ({
        ...movie,
        preferenceScore: this.calculatePreferenceScore(movie, userPreferences)
      }))
      .sort((a, b) => (b as any).preferenceScore - (a as any).preferenceScore);
  }

  private async calculateRecommendationScore(
    movie: Movie, 
    emotions: EmotionScores, 
    userPreferences: UserPreferences,
    userId?: string
  ): Promise<number> {
    let score = 0;

    score += movie.vote_average * 0.2;
    score += Math.log10(movie.popularity) * 0.1;

    const genreMatch = movie.genre_ids.some(genreId => 
      userPreferences.favoriteGenres.includes(genreId)
    );
    if (genreMatch) {
      score += 2;
    }

    const rating = userPreferences.ratings[movie.id];
    if (rating) {
      score += rating * 0.3;
    }

    const emotionCompatibility = await this.calculateEmotionCompatibility(emotions, movie.genre_ids, userId);
    score += emotionCompatibility * 3;

    return score;
  }

  private calculatePreferenceScore(movie: Movie, userPreferences: UserPreferences): number {
    let score = 0;

    score += movie.vote_average * 0.3;
    score += Math.log10(movie.popularity) * 0.2;

    const genreMatch = movie.genre_ids.filter(genreId => 
      userPreferences.favoriteGenres.includes(genreId)
    ).length;
    score += genreMatch * 1.5;

    const rating = userPreferences.ratings[movie.id];
    if (rating) {
      score += rating * 0.5;
    }

    return score;
  }

  private async getPopularMovies(limit: number): Promise<Movie[]> {
    try {
      const response = await GetMoviesByGenres([28, 12, 35, 18]);
      return response.results.slice(0, limit);
    } catch (error) {
      return [];
    }
  }

  async calculateEmotionCompatibility(userEmotions: EmotionScores, movieGenres: number[], userId?: string): Promise<number> {
    if (movieGenres.length === 0) return 0;
    
    let userMappings: PersonalizedMapping;
    
    if (userId) {
      // Use personalized mappings for the user
      userMappings = await personalizedEmotionMappingService.getUserEmotionGenreMappings(userId);
    } else {
      // Fallback to static mapping if no userId provided
      const emotionGenres = MapEmotionsToGenres(userEmotions);
      const intersection = movieGenres.filter(genre => emotionGenres.includes(genre));
      const union = [...new Set([...movieGenres, ...emotionGenres])];
      return intersection.length / union.length;
    }
    
    let totalScore = 0;
    let totalEmotionWeight = 0;
    
    // Calculate weighted compatibility using personalized mappings
    Object.entries(userEmotions).forEach(([emotion, intensity]) => {
      if (intensity > 0.01 && userMappings[emotion]) {
        totalEmotionWeight += intensity;
        
        // Check how well movie genres match this emotion
        movieGenres.forEach(genreId => {
          const genreWeight = userMappings[emotion][genreId] || 0;
          if (genreWeight > 0) {
            // Score = emotion intensity × personalized genre weight
            totalScore += intensity * genreWeight;
          }
        });
      }
    });
    
    // Normalize by total emotion weight only
    if (totalEmotionWeight === 0) return 0;
    
    const normalizedScore = totalScore / totalEmotionWeight;
    return Math.min(1, normalizedScore);
  }

}

export const recommendationService = new RecommendationService();
export default RecommendationService;