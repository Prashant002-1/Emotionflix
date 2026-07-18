import type { EmotionScores } from './emotion';

/**
 * Movie Type Definitions
 * 
 * Type definitions for TMDB (The Movie Database) API integration.
 * These types define the structure of movie data, genres, and API responses.
 */

/**
 * Movie genre as defined by TMDB.
 */
export interface Genre {
  /** TMDB genre ID */
  id: number;
  /** Human-readable genre name */
  name: string;
}

/**
 * Movie data structure from TMDB API.
 * Contains comprehensive movie information including metadata and ratings.
 */
export interface Movie {
  /** Unique TMDB movie ID */
  id: number;
  /** Movie title */
  title: string;
  /** Movie plot summary/description */
  overview: string;
  /** Release date in YYYY-MM-DD format */
  release_date: string;
  /** Path to poster image on TMDB (append to base URL) */
  poster_path: string | null;
  /** Path to backdrop image on TMDB (append to base URL) */
  backdrop_path: string | null;
  /** Array of TMDB genre IDs */
  genre_ids: number[];
  /** Full genre objects (when fetching detailed movie info) */
  genres?: Genre[];
  /** Movie runtime in minutes */
  runtime?: number;
  /** TMDB popularity score */
  popularity: number;
  /** Average user rating (0-10) */
  vote_average: number;
  /** Number of votes/ratings */
  vote_count: number;
  /** Whether the movie is rated for adults only */
  adult?: boolean;
  /** Original language code (e.g., 'en', 'es') */
  original_language?: string;
  /** Original title in native language */
  original_title?: string;
  /** Whether this is a video/documentary vs theatrical release */
  video?: boolean;
  /** Movie tagline/slogan */
  tagline?: string;
  /** Plain-language explanation returned by the recommendation API. */
  recommendation_reason?: string;
  /** People whose same-film responses led to this recommendation. */
  recommended_by?: {
    id: number;
    username: string;
    shared_film_title: string;
    shared_feelings: (keyof EmotionScores)[];
    response_feelings: (keyof EmotionScores)[];
    viewer_shared_note: string;
    person_shared_note: string;
    response_id: number;
    response_note: string;
  }[];
}

/**
 * Response structure for TMDB movie search API endpoints.
 * Contains paginated movie results with metadata.
 */
export interface MovieSearchResponse {
  /** Current page number in the search results */
  page: number;
  /** Array of movies for the current page */
  results: Movie[];
  /** Total number of pages available */
  total_pages: number;
  /** Total number of movie results across all pages */
  total_results: number;
}

/**
 * Response structure for TMDB genre list API endpoint.
 * Contains all available movie genres.
 */
export interface GenreResponse {
  /** Array of all available movie genres */
  genres: Genre[];
}
