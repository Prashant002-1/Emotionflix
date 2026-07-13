import pool from '../config/database';
import { getMovieDetails, TMDBMovie } from './tmdbService';

export const cacheMovie = async (movie: TMDBMovie): Promise<void> => {
  const genreIds = movie.genre_ids?.length ? movie.genre_ids : movie.genres?.map(genre => genre.id) || [];

  await pool.query(
    `INSERT INTO movies (id, title, overview, release_date, poster_path, backdrop_path, vote_average, vote_count, popularity, runtime, tmdb_data)
     VALUES ($1, $2, $3, NULLIF($4, '')::date, $5, $6, $7, $8, $9, $10, $11)
     ON CONFLICT (id) DO UPDATE SET
       title = EXCLUDED.title,
       overview = EXCLUDED.overview,
       release_date = EXCLUDED.release_date,
       poster_path = EXCLUDED.poster_path,
       backdrop_path = EXCLUDED.backdrop_path,
       vote_average = EXCLUDED.vote_average,
       vote_count = EXCLUDED.vote_count,
       popularity = EXCLUDED.popularity,
       runtime = COALESCE(EXCLUDED.runtime, movies.runtime),
       tmdb_data = EXCLUDED.tmdb_data,
       last_updated = CURRENT_TIMESTAMP`,
    [
      movie.id,
      movie.title,
      movie.overview || '',
      movie.release_date || '',
      movie.poster_path,
      movie.backdrop_path,
      movie.vote_average || 0,
      movie.vote_count || 0,
      movie.popularity || 0,
      movie.runtime || null,
      JSON.stringify({ ...movie, genre_ids: genreIds }),
    ],
  );

  for (const genreId of genreIds) {
    await pool.query(
      `INSERT INTO movie_genres (movie_id, genre_id) VALUES ($1, $2)
       ON CONFLICT (movie_id, genre_id) DO NOTHING`,
      [movie.id, genreId],
    );
  }
};

export const ensureMovie = async (movieId: number): Promise<TMDBMovie> => {
  const existing = await pool.query('SELECT tmdb_data FROM movies WHERE id = $1', [movieId]);
  if (existing.rowCount && existing.rows[0].tmdb_data) return existing.rows[0].tmdb_data as TMDBMovie;

  const movie = await getMovieDetails(movieId);
  await cacheMovie(movie);
  return movie;
};
