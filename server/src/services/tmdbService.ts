/**
 * TMDB Service
 * 
 * Server-side service for interacting with The Movie Database (TMDB) API.
 * Provides movie data retrieval, search functionality, and movie details
 * for server-side operations and data enrichment.
 */

import axios from 'axios';

const BASE_URL = 'https://api.themoviedb.org/3';
const API_KEY = process.env.VITE_TMDB_API_KEY || process.env.TMDB_API_KEY;

if (!API_KEY) {
  console.error('TMDB API key not found in environment variables');
}

/**
 * Pre-configured Axios client for TMDB API requests.
 * Includes base URL and API key authentication.
 */
const tmdbClient = axios.create({
  baseURL: BASE_URL,
  params: {
    api_key: API_KEY,
  },
});

/**
 * Movie data structure from TMDB API.
 * Represents basic movie information used for server-side operations.
 */
export interface TMDBMovie {
  /** Unique TMDB movie identifier */
  id: number;
  /** Movie title */
  title: string;
  /** Movie description/plot summary */
  overview: string;
  /** Release date in YYYY-MM-DD format */
  release_date: string;
  /** Path to poster image (relative to TMDB base URL) */
  poster_path: string | null;
  /** Path to backdrop image (relative to TMDB base URL) */
  backdrop_path: string | null;
  /** Average user rating (0-10) */
  vote_average: number;
  /** Total number of votes */
  vote_count: number;
  /** TMDB popularity score */
  popularity: number;
  /** Array of TMDB genre IDs */
  genre_ids: number[];
  genres?: { id: number; name: string }[];
  runtime?: number;
  tagline?: string;
  adult?: boolean;
  original_language?: string;
  original_title?: string;
  video?: boolean;
}

export interface TMDBResponse {
  page: number;
  results: TMDBMovie[];
  total_pages: number;
  total_results: number;
}

/**
 * Retrieves detailed information for a specific movie.
 * 
 * @param movieId - TMDB movie ID to fetch details for
 * @returns Promise resolving to movie details
 * @throws {Error} If movie not found or API request fails
 */
export const getMovieDetails = async (movieId: number): Promise<TMDBMovie> => {
  const response = await tmdbClient.get(`/movie/${movieId}`);
  const movie = response.data as TMDBMovie;
  if (!movie.genre_ids?.length && movie.genres) movie.genre_ids = movie.genres.map(genre => genre.id);
  return movie;
};

/**
 * Searches for movies by title or keywords.
 * 
 * @param query - Search query string
 * @returns Promise resolving to search results with movie array
 * @throws {Error} If API request fails
 */
export const searchMovies = async (query: string, page = 1): Promise<TMDBResponse> => {
  const response = await tmdbClient.get('/search/movie', {
    params: { query, page, include_adult: false }
  });
  return response.data as TMDBResponse;
};

export const getGenres = async (): Promise<{ genres: { id: number; name: string }[] }> => {
  const response = await tmdbClient.get('/genre/movie/list');
  return response.data as { genres: { id: number; name: string }[] };
};

export const getTrendingMovies = async (page = 1): Promise<TMDBResponse> => {
  const response = await tmdbClient.get('/trending/movie/week', { params: { page } });
  return response.data as TMDBResponse;
};

export const getPopularMovies = async (page = 1): Promise<TMDBResponse> => {
  const response = await tmdbClient.get('/movie/popular', { params: { page } });
  return response.data as TMDBResponse;
};

export const discoverMovies = async (genreIds: number[], page = 1): Promise<TMDBResponse> => {
  const response = await tmdbClient.get('/discover/movie', {
    params: {
      page,
      with_genres: genreIds.join('|'),
      sort_by: 'vote_count.desc',
      'vote_count.gte': 80,
      include_adult: false,
    },
  });
  return response.data as TMDBResponse;
};

export const getRelatedMovies = async (movieId: number): Promise<TMDBResponse> => {
  const response = await tmdbClient.get(`/movie/${movieId}/recommendations`);
  return response.data as TMDBResponse;
};
