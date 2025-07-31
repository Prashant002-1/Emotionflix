/**
 * TMDB API SERVICE
 *   Service for integrating with The Movie Database API
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
 * NAME
 *   GetGenres - Fetches all available movie genres from TMDB
 *
 * SYNOPSIS
 *   GetGenres(): Promise<GenreResponse>
 *
 * DESCRIPTION
 *   Retrieves the complete list of movie genres available in TMDB.
 *   This data is used for mapping emotions to genre categories.
 *
 * RETURNS
 *   Promise resolving to GenreResponse containing array of genres
 */
export const GetGenres = async (): Promise<GenreResponse> => {
  const response = await tmdbClientV3.get('/genre/movie/list');
  return response.data;
};

/**
 * NAME
 *   SearchMovies - Searches for movies by query string
 *
 * SYNOPSIS
 *   SearchMovies(a_query: string, a_page?: number): Promise<MovieSearchResponse>
 *     a_query: The search term for movies
 *     a_page: Optional page number for pagination (default: 1)
 *
 * DESCRIPTION
 *   Searches TMDB database for movies matching the provided query string.
 *   Returns paginated results with movie basic information.
 *
 * RETURNS
 *   Promise resolving to MovieSearchResponse with search results
 */
export const SearchMovies = async (a_query: string, a_page = 1): Promise<MovieSearchResponse> => {
  const response = await tmdbClientV3.get('/search/movie', {
    params: { query: a_query, page: a_page },
  });
  return response.data;
};

/**
 * NAME
 *   GetMovieDetails - Fetches detailed information for a specific movie
 *
 * SYNOPSIS
 *   GetMovieDetails(a_movieId: number): Promise<Movie>
 *     a_movieId: The TMDB movie ID
 *
 * DESCRIPTION
 *   Retrieves comprehensive movie details including genres, cast,
 *   and additional metadata for a specific movie.
 *
 * RETURNS
 *   Promise resolving to Movie object with complete details
 */
export const GetMovieDetails = async (a_movieId: number): Promise<Movie> => {
  const response = await tmdbClientV3.get(`/movie/${a_movieId}`);
  return response.data;
};

/**
 * NAME
 *   GetMoviesByGenres - Discovers movies filtered by genre IDs
 *
 * SYNOPSIS
 *   GetMoviesByGenres(a_genreIds: number[], a_page?: number): Promise<MovieSearchResponse>
 *     a_genreIds: Array of genre IDs to filter by
 *     a_page: Optional page number for pagination (default: 1)
 *
 * DESCRIPTION
 *   Uses TMDB's discover endpoint to find movies matching specific genres.
 *   This is the core function for emotion-based recommendations.
 *
 * RETURNS
 *   Promise resolving to MovieSearchResponse with filtered results
 */
export const GetMoviesByGenres = async (a_genreIds: number[], a_page = 1): Promise<MovieSearchResponse> => {
  const response = await tmdbClientV3.get('/discover/movie', {
    params: {
      with_genres: a_genreIds.join(','),
      page: a_page,
      sort_by: 'popularity.desc',
    },
  });
  return response.data;
};

/**
 * NAME
 *   GetTrendingMovies - Fetches currently trending movies
 *
 * SYNOPSIS
 *   GetTrendingMovies(a_page?: number): Promise<MovieSearchResponse>
 *     a_page: Optional page number for pagination (default: 1)
 *
 * DESCRIPTION
 *   Retrieves movies that are currently trending on TMDB.
 *   Used for dashboard display and general discovery.
 *
 * RETURNS
 *   Promise resolving to MovieSearchResponse with trending movies
 */
export const GetTrendingMovies = async (a_page = 1): Promise<MovieSearchResponse> => {
  const response = await tmdbClientV3.get('/trending/movie/day', {
    params: { page: a_page },
  });
  return response.data;
};

/**
 * NAME
 *   GetPopularMovies - Fetches popular movies
 *
 * SYNOPSIS
 *   GetPopularMovies(a_page?: number): Promise<MovieSearchResponse>
 *     a_page: Optional page number for pagination (default: 1)
 *
 * DESCRIPTION
 *   Retrieves currently popular movies from TMDB.
 *   Used for dashboard display and general discovery.
 *
 * RETURNS
 *   Promise resolving to MovieSearchResponse with popular movies
 */
export const GetPopularMovies = async (a_page = 1): Promise<MovieSearchResponse> => {
  const response = await tmdbClientV3.get('/movie/popular', {
    params: { page: a_page },
  });
  return response.data;
};