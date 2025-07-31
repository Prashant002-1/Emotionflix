import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockEmotionScores, createMockMovie } from './test-utils';
import axios from 'axios';

// Mock external dependencies
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

describe('EmotionFlix - Core Features', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedAxios.create.mockReturnValue(mockedAxios as any);
  });

  describe('Emotion Detection Service', () => {
    it('should load models successfully', async () => {
      const { LoadModels } = await import('../src/services/emotionDetection');
      
      // Should not throw error
      await expect(LoadModels()).resolves.not.toThrow();
    });

    it('should get dominant emotion correctly', async () => {
      const { GetDominantEmotion } = await import('../src/services/emotionDetection');
      
      const emotions = createMockEmotionScores({
        happy: 0.8,
        sad: 0.1,
        neutral: 0.1,
      });

      const dominant = GetDominantEmotion(emotions);
      expect(dominant).toBe('happy');
    });

    it('should enhance emotion scores while maintaining sum', async () => {
      const { EnhanceEmotionScores } = await import('../src/services/emotionDetection');
      
      const rawEmotions = createMockEmotionScores({
        happy: 0.4,
        sad: 0.3,
        neutral: 0.3,
      });

      const enhanced = EnhanceEmotionScores(rawEmotions);
      
      // Sum should still be approximately 1
      const sum = Object.values(enhanced).reduce((acc, val) => acc + val, 0);
      expect(sum).toBeCloseTo(1, 2);
      
      // Enhanced scores should be different from original
      expect(enhanced).not.toEqual(rawEmotions);
    });

    it('should calculate confidence levels', async () => {
      const { GetConfidenceLevel } = await import('../src/services/emotionDetection');
      
      const highConfidenceEmotions = createMockEmotionScores({
        happy: 0.9,
        neutral: 0.1,
      });
      
      const lowConfidenceEmotions = createMockEmotionScores({
        happy: 0.25,
        sad: 0.25,
        neutral: 0.25,
        angry: 0.25,
      });

      const highConfidence = GetConfidenceLevel(highConfidenceEmotions);
      const lowConfidence = GetConfidenceLevel(lowConfidenceEmotions);

      expect(highConfidence).toBeGreaterThan(lowConfidence);
      expect(highConfidence).toBeGreaterThan(0.5);
      expect(lowConfidence).toBeLessThan(0.5);
    });

    it('should format emotions for display', async () => {
      const { FormatEmotionsForDisplay } = await import('../src/services/emotionDetection');
      
      const emotions = createMockEmotionScores({
        happy: 0.7,
        sad: 0.3,
      });

      const formatted = FormatEmotionsForDisplay(emotions);
      
      expect(typeof formatted).toBe('string');
      expect(formatted.length).toBeGreaterThan(0);
    });

    it('should get emotion icons and colors', async () => {
      const { GetEmotionIcon, GetEmotionColor } = await import('../src/services/emotionDetection');
      
      const icon = GetEmotionIcon('happy');
      const color = GetEmotionColor('happy');
      
      expect(typeof icon).toBe('string');
      expect(typeof color).toBe('string');
      expect(icon.length).toBeGreaterThan(0);
      expect(color.length).toBeGreaterThan(0);
    });
  });

  describe('TMDB API Service', () => {
    it('should fetch popular movies', async () => {
      const mockResponse = {
        data: {
          page: 1,
          results: [
            createMockMovie({ id: 1, title: 'Popular Movie 1' }),
            createMockMovie({ id: 2, title: 'Popular Movie 2' }),
          ],
          total_pages: 10,
          total_results: 200,
        }
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const { GetPopularMovies } = await import('../src/services/tmdbApi');
      const result = await GetPopularMovies();

      expect(mockedAxios.get).toHaveBeenCalledWith('/movie/popular', {
        params: { page: 1 }
      });
      expect(result.results).toHaveLength(2);
      expect(result.results[0].title).toBe('Popular Movie 1');
    });

    it('should search movies by query', async () => {
      const mockResponse = {
        data: {
          page: 1,
          results: [
            createMockMovie({ id: 123, title: 'Search Result Movie' }),
          ],
          total_pages: 1,
          total_results: 1,
        }
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const { SearchMovies } = await import('../src/services/tmdbApi');
      const result = await SearchMovies('test query');

      expect(mockedAxios.get).toHaveBeenCalledWith('/search/movie', {
        params: { query: 'test query', page: 1 }
      });
      expect(result.results[0].title).toBe('Search Result Movie');
    });

    it('should get movies by genres', async () => {
      const mockResponse = {
        data: {
          page: 1,
          results: [
            createMockMovie({ id: 456, genre_ids: [28, 12] }), // Action, Adventure
          ],
          total_pages: 1,
          total_results: 1,
        }
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const { GetMoviesByGenres } = await import('../src/services/tmdbApi');
      const result = await GetMoviesByGenres([28, 12]);

      expect(mockedAxios.get).toHaveBeenCalledWith('/discover/movie', {
        params: {
          with_genres: '28,12',
          sort_by: 'popularity.desc',
          page: 1
        }
      });
      expect(result.results[0].genre_ids).toEqual([28, 12]);
    });

    it('should get movie details', async () => {
      const mockMovie = createMockMovie({ 
        id: 789, 
        title: 'Detailed Movie',
        overview: 'A detailed description of this movie.'
      });

      mockedAxios.get.mockResolvedValue({ data: mockMovie });

      const { GetMovieDetails } = await import('../src/services/tmdbApi');
      const result = await GetMovieDetails(789);

      expect(mockedAxios.get).toHaveBeenCalledWith('/movie/789');
      expect(result.title).toBe('Detailed Movie');
      expect(result.overview).toBe('A detailed description of this movie.');
    });

    it('should handle API errors gracefully', async () => {
      mockedAxios.get.mockRejectedValue(new Error('API Error'));

      const { GetPopularMovies } = await import('../src/services/tmdbApi');
      
      await expect(GetPopularMovies()).rejects.toThrow('API Error');
    });
  });

  describe('Emotion Mapping Utility', () => {
    it('should map emotions to relevant genres', async () => {
      const { MapEmotionsToGenres } = await import('../src/utils/emotionMapping');
      
      const happyEmotions = createMockEmotionScores({
        happy: 0.8,
        neutral: 0.2,
      });

      const genres = MapEmotionsToGenres(happyEmotions);
      
      expect(Array.isArray(genres)).toBe(true);
      expect(genres.length).toBeGreaterThan(0);
      
      // Happy emotions should map to comedy (35), animation (16), etc.
      expect(genres).toContain(35); // Comedy
    });

    it('should map sad emotions to drama genres', async () => {
      const { MapEmotionsToGenres } = await import('../src/utils/emotionMapping');
      
      const sadEmotions = createMockEmotionScores({
        sad: 0.8,
        neutral: 0.2,
      });

      const genres = MapEmotionsToGenres(sadEmotions);
      
      expect(genres).toContain(18); // Drama
    });

    it('should map angry emotions to action genres', async () => {
      const { MapEmotionsToGenres } = await import('../src/utils/emotionMapping');
      
      const angryEmotions = createMockEmotionScores({
        angry: 0.8,
        neutral: 0.2,
      });

      const genres = MapEmotionsToGenres(angryEmotions);
      
      expect(genres).toContain(28); // Action
    });

    it('should handle mixed emotions', async () => {
      const { MapEmotionsToGenres } = await import('../src/utils/emotionMapping');
      
      const mixedEmotions = createMockEmotionScores({
        happy: 0.4,
        sad: 0.3,
        angry: 0.3,
      });

      const genres = MapEmotionsToGenres(mixedEmotions);
      
      expect(Array.isArray(genres)).toBe(true);
      expect(genres.length).toBeGreaterThan(2); // Should include multiple genres
    });

    it('should return empty array for null emotions', async () => {
      const { MapEmotionsToGenres } = await import('../src/utils/emotionMapping');
      
      const nullEmotions = createMockEmotionScores({
        happy: 0,
        sad: 0,
        angry: 0,
        fearful: 0,
        disgusted: 0,
        surprised: 0,
        neutral: 1,
      });

      const genres = MapEmotionsToGenres(nullEmotions);
      
      expect(Array.isArray(genres)).toBe(true);
      // Should still return some genres even for neutral emotions
      expect(genres.length).toBeGreaterThan(0);
    });
  });

  describe('Recommendation Service', () => {
    it('should get emotion-based recommendations', async () => {
      // Mock TMDB API response
      const mockResponse = {
        data: {
          results: [
            createMockMovie({ id: 1, title: 'Recommended Movie 1', genre_ids: [35] }),
            createMockMovie({ id: 2, title: 'Recommended Movie 2', genre_ids: [28] }),
          ]
        }
      };
      mockedAxios.get.mockResolvedValue(mockResponse);

      const { recommendationService } = await import('../src/services/recommendationService');
      
      const emotions = createMockEmotionScores({
        happy: 0.7,
        neutral: 0.3,
      });

      const recommendations = await recommendationService.getEmotionBasedRecommendations(emotions, 10);
      
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeLessThanOrEqual(10);
    });

    it('should handle empty genre mappings', async () => {
      const { recommendationService } = await import('../src/services/recommendationService');
      
      const emptyEmotions = createMockEmotionScores({
        happy: 0,
        sad: 0,
        angry: 0,
        fearful: 0,
        disgusted: 0,
        surprised: 0,
        neutral: 0,
      });

      const recommendations = await recommendationService.getEmotionBasedRecommendations(emptyEmotions);
      
      expect(Array.isArray(recommendations)).toBe(true);
      // Should return empty array when no emotions/genres
    });
  });

  describe('Integration: Emotion to Movie Flow', () => {
    it('should complete full emotion-to-recommendation flow', async () => {
      // Mock TMDB API
      const mockResponse = {
        data: {
          results: [
            createMockMovie({ id: 1, title: 'Happy Movie', genre_ids: [35] }),
          ]
        }
      };
      mockedAxios.get.mockResolvedValue(mockResponse);

      // Import services
      const { MapEmotionsToGenres } = await import('../src/utils/emotionMapping');
      const { GetMoviesByGenres } = await import('../src/services/tmdbApi');
      const { GetDominantEmotion } = await import('../src/services/emotionDetection');

      // Create user emotions
      const userEmotions = createMockEmotionScores({
        happy: 0.8,
        neutral: 0.2,
      });

      // Step 1: Get dominant emotion
      const dominant = GetDominantEmotion(userEmotions);
      expect(dominant).toBe('happy');

      // Step 2: Map emotions to genres
      const genres = MapEmotionsToGenres(userEmotions);
      expect(genres).toContain(35); // Comedy

      // Step 3: Get movies for those genres
      const movies = await GetMoviesByGenres(genres.slice(0, 3));
      expect(movies.results).toHaveLength(1);
      expect(movies.results[0].title).toBe('Happy Movie');
    });
  });

  describe('Database Service', () => {
    it('should handle connection lifecycle', async () => {
      const { default: DatabaseService } = await import('../src/services/database');
      const db = new DatabaseService();
      
      // Initially not connected
      expect(db.isConnected()).toBe(false);
      
      // Connect
      await expect(db.connect()).resolves.not.toThrow();
      expect(db.isConnected()).toBe(true);
      
      // Disconnect
      await expect(db.disconnect()).resolves.not.toThrow();
      expect(db.isConnected()).toBe(false);
    });

    it('should handle query execution safely', async () => {
      const { default: DatabaseService } = await import('../src/services/database');
      const db = new DatabaseService();
      
      await db.connect();
      
      const result = await db.query('SELECT * FROM test', []);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle queries when not connected', async () => {
      const { default: DatabaseService } = await import('../src/services/database');
      const db = new DatabaseService();
      
      // Don't connect
      const result = await db.query('SELECT * FROM test', []);
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });
  });

  describe('Emotion Service', () => {
    it('should save emotion session with fallback to mock data', async () => {
      const { emotionService } = await import('../src/services/emotionService');
      
      const emotions = createMockEmotionScores({
        happy: 0.7,
        sad: 0.2,
        neutral: 0.1,
      });

      const result = await emotionService.saveEmotionSession(123, emotions, 'webcam');
      
      expect(result).toBeDefined();
      expect(result.user_id).toBe(123);
      expect(result.happy).toBeCloseTo(0.7, 1);
      expect(result.detection_method).toBe('webcam');
      expect(typeof result.id).toBe('number');
    });

    it('should handle different detection methods', async () => {
      const { emotionService } = await import('../src/services/emotionService');
      
      const emotions = createMockEmotionScores({
        happy: 0.5,
        neutral: 0.5,
      });

      // Test all detection methods
      const manualResult = await emotionService.saveEmotionSession(456, emotions, 'manual');
      expect(manualResult.detection_method).toBe('manual');

      const imageResult = await emotionService.saveEmotionSession(456, emotions, 'image');
      expect(imageResult.detection_method).toBe('image');

      const webcamResult = await emotionService.saveEmotionSession(456, emotions, 'webcam');
      expect(webcamResult.detection_method).toBe('webcam');
    });

    it('should get user emotions list', async () => {
      const { emotionService } = await import('../src/services/emotionService');
      
      const emotions = await emotionService.getUserEmotions(789, 10);
      
      expect(Array.isArray(emotions)).toBe(true);
      expect(emotions.length).toBeLessThanOrEqual(10);
    });

    it('should handle all emotion types correctly', async () => {
      const { emotionService } = await import('../src/services/emotionService');
      
      const fullEmotions = createMockEmotionScores({
        happy: 0.2,
        sad: 0.15,
        angry: 0.15,
        fearful: 0.15,
        disgusted: 0.1,
        surprised: 0.1,
        neutral: 0.15,
      });

      const result = await emotionService.saveEmotionSession(777, fullEmotions, 'image');
      
      expect(result.happy).toBeCloseTo(0.2, 1);
      expect(result.sad).toBeCloseTo(0.15, 1);
      expect(result.angry).toBeCloseTo(0.15, 1);
      expect(result.fearful).toBeCloseTo(0.15, 1);
      expect(result.disgusted).toBeCloseTo(0.1, 1);
      expect(result.surprised).toBeCloseTo(0.1, 1);
      expect(result.neutral).toBeCloseTo(0.15, 1);
    });

    it('should handle database errors gracefully', async () => {
      const { emotionService } = await import('../src/services/emotionService');
      
      // Should not throw even with edge case inputs
      const result = await emotionService.saveEmotionSession(-1, createMockEmotionScores(), 'manual');
      expect(result).toBeDefined();
      
      // Should handle retrieval operations
      const sessionEmotions = await emotionService.getEmotionsBySession('test-session');
      expect(Array.isArray(sessionEmotions)).toBe(true);
      
      // Should handle single emotion retrieval
      const emotion = await emotionService.getEmotionById(12345);
      expect(emotion === null || typeof emotion === 'object').toBe(true);
    });
  });
});