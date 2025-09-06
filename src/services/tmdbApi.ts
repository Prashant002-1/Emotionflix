/**
 * TMDB API Service
 * 
 * Service for integrating with The Movie Database (TMDB) API.
 * Provides functions for fetching movie data, genres, search results,
 * and detailed movie information from TMDB's REST API.
 */

import axios from 'axios';
import { Movie, MovieSearchResponse, GenreResponse } from '../types/movie';

const BASE_URL_V3 = 'https://api.themoviedb.org/3';
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const tmdbClientV3 = axios.create({
  baseURL: BASE_URL_V3,
  params: {
    api_key: API_KEY,
  },
});

/**
 * Fetches all available movie genres from TMDB.
 * Retrieves the complete list of movie genres available in TMDB,
 * used for mapping emotions to genre categories.
 * 
 * @returns Promise resolving to GenreResponse containing array of genres
 */
export const GetGenres = async (): Promise<GenreResponse> => {
  const response = await tmdbClientV3.get('/genre/movie/list');
  return response.data;
};

/**
 * Searches for movies by query string.
 * Searches TMDB database for movies matching the provided query string
 * and returns paginated results with basic movie information.
 * 
 * @param query - The search term for movies
 * @param page - Optional page number for pagination (default: 1)
 * @returns Promise resolving to MovieSearchResponse with search results
 */
export const SearchMovies = async (query: string, page = 1): Promise<MovieSearchResponse> => {
  const response = await tmdbClientV3.get('/search/movie', {
    params: { query: query, page: page },
  });
  return response.data;
};

/**
 * Fetches detailed information for a specific movie.
 * Retrieves comprehensive movie details including genres, cast,
 * and additional metadata for a specific movie.
 * 
 * @param movieId - The TMDB movie ID
 * @returns Promise resolving to Movie object with complete details
 */
export const GetMovieDetails = async (movieId: number): Promise<Movie> => {
  const response = await tmdbClientV3.get(`/movie/${movieId}`);
  return response.data;
};

/**
 * Discovers movies filtered by genre IDs.
 * Uses TMDB's discover endpoint to find movies matching specific genres.
 * This is the core function for emotion-based recommendations.
 * 
 * @param genreIds - Array of genre IDs to filter by
 * @param page - Optional page number for pagination (default: 1)
 * @returns Promise resolving to MovieSearchResponse with filtered results
 */
export const GetMoviesByGenres = async (genreIds: number[], page = 1): Promise<MovieSearchResponse> => {
  const response = await tmdbClientV3.get('/discover/movie', {
    params: {
      with_genres: genreIds.join(','),
      page: page,
      sort_by: 'popularity.desc',
    },
  });
  return response.data;
};

/**
 * Fetches currently trending movies.
 * Retrieves movies that are currently trending on TMDB,
 * used for dashboard display and general discovery.
 * 
 * @param page - Optional page number for pagination (default: 1)
 * @returns Promise resolving to MovieSearchResponse with trending movies
 */
export const GetTrendingMovies = async (page = 1): Promise<MovieSearchResponse> => {
  const response = await tmdbClientV3.get('/trending/movie/day', {
    params: { page: page },
  });
  return response.data;
};

/**
 * Fetches popular movies from TMDB.
 * Retrieves currently popular movies from TMDB,
 * used for dashboard display and general discovery.
 * 
 * @param page - Optional page number for pagination (default: 1)
 * @returns Promise resolving to MovieSearchResponse with popular movies
 */
export const GetPopularMovies = async (page = 1): Promise<MovieSearchResponse> => {
  const response = await tmdbClientV3.get('/movie/popular', {
    params: { page: page },
  });
  return response.data;
};