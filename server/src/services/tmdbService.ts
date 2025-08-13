import axios from 'axios';

const BASE_URL = 'https://api.themoviedb.org/3';
const API_KEY = process.env.VITE_TMDB_API_KEY || process.env.TMDB_API_KEY;

if (!API_KEY) {
  console.error('TMDB API key not found in environment variables');
}

const tmdbClient = axios.create({
  baseURL: BASE_URL,
  params: {
    api_key: API_KEY,
  },
});

export interface TMDBMovie {
  id: number;
  title: string;
  overview: string;
  release_date: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids: number[];
}

export const getMovieDetails = async (movieId: number): Promise<TMDBMovie> => {
  const response = await tmdbClient.get(`/movie/${movieId}`);
  return response.data as TMDBMovie;
};

export const searchMovies = async (query: string): Promise<{ results: TMDBMovie[] }> => {
  const response = await tmdbClient.get('/search/movie', {
    params: { query }
  });
  return response.data as { results: TMDBMovie[] };
};
