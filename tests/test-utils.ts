/**
 * Test Utilities for EmotionFlix Frontend Tests
 * 
 * Provides mock data creators, test helper functions, and utility methods
 * for testing emotion detection, movie data, and UI interactions across
 * the frontend application test suite.
 */

import { vi } from 'vitest';
import { EmotionScores } from '../src/types/emotion';
import { Movie } from '../src/types/movie';

/**
 * Creates mock emotion scores for testing
 * 
 * Generates normalized emotion data with optional overrides for testing
 * specific emotion states and detection scenarios.
 * 
 * @param overrides - Partial emotion scores to override defaults
 * @returns Normalized emotion scores object
 */
export function createMockEmotionScores(overrides: Partial<EmotionScores> = {}): EmotionScores {
  const defaultEmotions: EmotionScores = {
    happy: 0.3,
    sad: 0.1,
    angry: 0.1,
    fearful: 0.1,
    disgusted: 0.1,
    surprised: 0.1,
    neutral: 0.2,
  };

  // If overrides are provided, only apply them and set others to 0
  if (Object.keys(overrides).length > 0) {
    const emotions: EmotionScores = {
      happy: 0,
      sad: 0,
      angry: 0,
      fearful: 0,
      disgusted: 0,
      surprised: 0,
      neutral: 0,
      ...overrides,
    };
    
    // Normalize to sum to 1
    const sum = Object.values(emotions).reduce((acc, val) => acc + val, 0);
    if (sum > 0) {
      Object.keys(emotions).forEach(key => {
        emotions[key as keyof EmotionScores] = emotions[key as keyof EmotionScores] / sum;
      });
    }
    
    return emotions;
  }

  return defaultEmotions;
}

/**
 * Creates mock movie data for testing
 * 
 * Generates complete movie objects with TMDB-compatible structure
 * for testing movie display, search, and recommendation functionality.
 * 
 * @param overrides - Partial movie properties to override defaults
 * @returns Complete movie object for testing
 */
export function createMockMovie(overrides: Partial<Movie> = {}): Movie {
  return {
    id: 1,
    title: 'Test Movie',
    overview: 'A test movie for testing purposes.',
    poster_path: '/test-poster.jpg',
    backdrop_path: '/test-backdrop.jpg',
    genre_ids: [28, 12], // Action, Adventure
    vote_average: 7.5,
    vote_count: 1000,
    popularity: 100,
    release_date: '2023-01-01',
    adult: false,
    original_language: 'en',
    original_title: 'Test Movie',
    video: false,
    ...overrides,
  };
}

/**
 * Creates mock TMDB search response for testing
 * 
 * Generates paginated movie search response structure compatible
 * with TMDB API format for testing search functionality.
 * 
 * @param movies - Array of movies to include in response
 * @returns TMDB-compatible search response object
 */
export function createMockMovieSearchResponse(movies: Movie[] = []) {
  const defaultMovies = movies.length > 0 ? movies : [
    createMockMovie({ id: 1, title: 'Movie 1' }),
    createMockMovie({ id: 2, title: 'Movie 2' }),
    createMockMovie({ id: 3, title: 'Movie 3' }),
  ];

  return {
    page: 1,
    results: defaultMovies,
    total_pages: 1,
    total_results: defaultMovies.length,
  };
}

/**
 * Utility function for async test delays
 * 
 * Provides Promise-based delay mechanism for testing async operations
 * and timing-dependent functionality.
 * 
 * @param ms - Milliseconds to delay execution
 * @returns Promise that resolves after specified delay
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Mocks console methods for clean test output
 * 
 * Temporarily replaces console methods with Vitest mocks to prevent
 * console noise during testing and enable assertion on console calls.
 * 
 * @returns Object with restore method to revert console methods
 */
export function mockConsole() {
  const originalConsole = { ...console };
  console.log = vi.fn();
  console.warn = vi.fn();
  console.error = vi.fn();
  
  return {
    restore: () => {
      Object.assign(console, originalConsole);
    },
  };
}

/**
 * Re-export React Testing Library utilities
 * 
 * Provides centralized access to testing utilities with user event
 * handling for comprehensive component testing capabilities.
 */
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';