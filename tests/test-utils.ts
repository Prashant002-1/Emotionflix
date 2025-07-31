import { vi } from 'vitest';
import { EmotionScores } from '../src/types/emotion';
import { Movie } from '../src/types/movie';

// Mock data creators
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

// Test helper functions
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

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

// Re-export testing library utilities (without custom render for now)
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';