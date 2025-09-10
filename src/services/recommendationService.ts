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
      // Validate emotions input
      if (!emotions || Object.keys(emotions).length === 0) {
        console.warn('No emotions provided, falling back to popular movies');
        return this.getPopularMovies(limit);
      }

      // Check if emotions are meaningful (not all zero or very low)
      const totalEmotionIntensity = Object.values(emotions).reduce((sum, val) => sum + val, 0);
      if (totalEmotionIntensity < 0.1) {
        console.warn('Very low emotion intensity, falling back to popular movies');
        return this.getPopularMovies(limit);
      }

      const genreIds = MapEmotionsToGenres(emotions);
      
      if (genreIds.length === 0) {
        console.warn('No genres mapped from emotions, falling back to popular movies');
        return this.getPopularMovies(limit);
      }

      // Fetch movies from multiple pages for better variety
      const moviesPerPage = 20;
      const maxPages = Math.min(3, Math.ceil(limit / moviesPerPage));
      let allMovies: Movie[] = [];

      for (let page = 1; page <= maxPages; page++) {
        try {
          const response = await GetMoviesByGenres(genreIds, page);
          allMovies = allMovies.concat(response.results);
          
          // Stop if we have enough movies
          if (allMovies.length >= limit * 2) break;
        } catch (pageError) {
          console.warn(`Failed to fetch page ${page}, continuing with available movies`);
          break;
        }
      }

      if (allMovies.length === 0) {
        console.warn('No movies found for emotion-based genres, falling back to popular movies');
        return this.getPopularMovies(limit);
      }

      // Remove duplicates
      const uniqueMovies = allMovies.filter((movie, index, self) => 
        index === self.findIndex(m => m.id === movie.id)
      );

      let movies = uniqueMovies;

      if (userPreferences) {
        movies = await this.filterAndRankMovies(movies, emotions, userPreferences, userId);
      }

      // Ensure we return the requested number of movies
      return movies.slice(0, limit);
    } catch (error) {
      console.error('Error in getEmotionBasedRecommendations:', error);
      // Fallback to popular movies on any error
      return this.getPopularMovies(limit);
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

    // 1. Quality Score (30% weight) - Movie quality indicators
    const qualityScore = this.calculateQualityScore(movie);
    score += qualityScore * 0.3;

    // 2. User Preference Score (25% weight) - Based on user's historical preferences
    const preferenceScore = this.calculateUserPreferenceScore(movie, userPreferences);
    score += preferenceScore * 0.25;

    // 3. Emotion Compatibility Score (35% weight) - How well emotions match movie genres
    const emotionCompatibility = await this.calculateEmotionCompatibility(emotions, movie.genre_ids, userId);
    score += emotionCompatibility * 0.35;

    // 4. Diversity Score (10% weight) - Encourage variety in recommendations
    const diversityScore = this.calculateDiversityScore(movie, userPreferences);
    score += diversityScore * 0.1;

    return Math.min(10, Math.max(0, score)); // Clamp between 0-10
  }

  private calculateQualityScore(movie: Movie): number {
    // Normalize vote average (0-10 scale)
    const normalizedRating = movie.vote_average / 10;
    
    // Normalize popularity using log scale (handles wide range)
    const normalizedPopularity = Math.min(1, Math.log10(movie.popularity + 1) / 3);
    
    // Weighted combination favoring rating over popularity
    return (normalizedRating * 0.7) + (normalizedPopularity * 0.3);
  }

  private calculateUserPreferenceScore(movie: Movie, userPreferences: UserPreferences): number {
    let score = 0;

    // Genre preference matching (weighted by number of matching genres)
    const matchingGenres = movie.genre_ids.filter(genreId => 
      userPreferences.favoriteGenres.includes(genreId)
    );
    const genreMatchRatio = matchingGenres.length / Math.max(1, movie.genre_ids.length);
    score += genreMatchRatio * 3; // Up to 3 points for genre matching

    // User rating bonus
    const userRating = userPreferences.ratings[movie.id];
    if (userRating) {
      score += (userRating / 10) * 2; // Up to 2 points for user rating
    }

    // Avoid recently watched movies
    if (userPreferences.watchHistory.includes(movie.id)) {
      score -= 1; // Penalty for already watched
    }

    return Math.min(5, Math.max(0, score)); // Clamp between 0-5
  }

  private calculateDiversityScore(movie: Movie, userPreferences: UserPreferences): number {
    // Encourage diversity by giving bonus to genres user hasn't watched much
    // This is a simplified implementation - in a full system, you'd track genre frequencies
    
    // Give bonus to less-watched genres (genres not in user's favorites)
    const leastWatchedGenres = movie.genre_ids.filter(genreId => 
      !userPreferences.favoriteGenres.includes(genreId)
    );
    
    return Math.min(2, leastWatchedGenres.length * 0.5); // Up to 2 points for diversity
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
      // Enhanced fallback to static mapping with better scoring
      return this.calculateStaticEmotionCompatibility(userEmotions, movieGenres);
    }
    
    let totalScore = 0;
    let totalEmotionWeight = 0;
    let genreMatchCount = 0;
    
    // Calculate weighted compatibility using personalized mappings
    Object.entries(userEmotions).forEach(([emotion, intensity]) => {
      if (intensity > 0.01 && userMappings[emotion]) {
        totalEmotionWeight += intensity;
        
        // Check how well movie genres match this emotion
        movieGenres.forEach(genreId => {
          const genreWeight = userMappings[emotion][genreId] || 0;
          if (genreWeight > 0) {
            // Enhanced scoring: emotion intensity × personalized genre weight × genre relevance
            const genreRelevance = this.calculateGenreRelevance(genreId, movieGenres);
            totalScore += intensity * genreWeight * genreRelevance;
            genreMatchCount++;
          }
        });
      }
    });
    
    // Normalize by total emotion weight
    if (totalEmotionWeight === 0) return 0;
    
    let normalizedScore = totalScore / totalEmotionWeight;
    
    // Bonus for multiple genre matches (encourages diverse recommendations)
    const genreMatchBonus = Math.min(0.2, genreMatchCount * 0.05);
    normalizedScore += genreMatchBonus;
    
    return Math.min(1, normalizedScore);
  }

  private calculateStaticEmotionCompatibility(userEmotions: EmotionScores, movieGenres: number[]): number {
    const emotionGenres = MapEmotionsToGenres(userEmotions);
    
    if (emotionGenres.length === 0) return 0;
    
    // Calculate weighted intersection based on emotion intensities
    let weightedIntersection = 0;
    let totalWeight = 0;
    
    Object.entries(userEmotions).forEach(([emotion, intensity]) => {
      if (intensity > 0.01) {
        const emotionGenreIds = MapEmotionsToGenres({ [emotion]: intensity } as EmotionScores);
        const intersection = movieGenres.filter(genre => emotionGenreIds.includes(genre));
        
        if (intersection.length > 0) {
          weightedIntersection += intensity * intersection.length;
          totalWeight += intensity;
        }
      }
    });
    
    if (totalWeight === 0) return 0;
    
    // Normalize by total weight and genre count
    const baseScore = weightedIntersection / totalWeight;
    const genreCoverage = movieGenres.filter(genre => emotionGenres.includes(genre)).length / movieGenres.length;
    
    return Math.min(1, baseScore * genreCoverage);
  }

  private calculateGenreRelevance(genreId: number, movieGenres: number[]): number {
    // Calculate how central this genre is to the movie
    // Primary genres (first few) get higher relevance
    const genreIndex = movieGenres.indexOf(genreId);
    if (genreIndex === -1) return 0;
    
    // First genre gets 1.0, second gets 0.8, etc.
    return Math.max(0.3, 1.0 - (genreIndex * 0.2));
  }

}

export const recommendationService = new RecommendationService();
export default RecommendationService;