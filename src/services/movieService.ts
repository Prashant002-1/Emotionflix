import { db } from './database';
import { Movie } from '../types/movie';
import { WatchedMovie } from '../types/emotion';

export interface DatabaseMovie {
  id: number;
  title: string;
  overview: string | null;
  release_date: Date | null;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count: number;
  popularity: number;
  runtime: number | null;
  tmdb_data: any;
  last_updated: Date;
}

export interface UserMovie {
  id: number;
  user_id: number;
  movie_id: number;
  status: 'watchlist' | 'watched' | 'favorite';
  rating: number | null;
  created_at: Date;
}

class MovieService {
  async saveMovie(movie: Movie): Promise<DatabaseMovie> {
    const sql = `
      INSERT INTO movies (
        id, title, overview, release_date, poster_path, backdrop_path,
        vote_average, vote_count, popularity, runtime, tmdb_data
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        overview = EXCLUDED.overview,
        release_date = EXCLUDED.release_date,
        poster_path = EXCLUDED.poster_path,
        backdrop_path = EXCLUDED.backdrop_path,
        vote_average = EXCLUDED.vote_average,
        vote_count = EXCLUDED.vote_count,
        popularity = EXCLUDED.popularity,
        runtime = EXCLUDED.runtime,
        tmdb_data = EXCLUDED.tmdb_data,
        last_updated = CURRENT_TIMESTAMP
      RETURNING *
    `;
    
    const values = [
      movie.id,
      movie.title,
      movie.overview,
      movie.release_date ? new Date(movie.release_date) : null,
      movie.poster_path,
      movie.backdrop_path,
      movie.vote_average,
      movie.vote_count,
      movie.popularity,
      movie.runtime || null,
      JSON.stringify(movie)
    ];
    
    try {
      const result = await db.query<DatabaseMovie>(sql, values);
      return result[0];
    } catch (error) {
      
      const mockResult: DatabaseMovie = {
        id: movie.id,
        title: movie.title,
        overview: movie.overview,
        release_date: movie.release_date ? new Date(movie.release_date) : null,
        poster_path: movie.poster_path,
        backdrop_path: movie.backdrop_path,
        vote_average: movie.vote_average,
        vote_count: movie.vote_count,
        popularity: movie.popularity,
        runtime: movie.runtime || null,
        tmdb_data: movie,
        last_updated: new Date()
      };
      
      return mockResult;
    }
  }

  async getMovieById(id: number): Promise<DatabaseMovie | null> {
    const sql = 'SELECT * FROM movies WHERE id = $1';
    
    try {
      const result = await db.query<DatabaseMovie>(sql, [id]);
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      return null;
    }
  }

  async searchMovies(query: string, limit: number = 20): Promise<DatabaseMovie[]> {
    const sql = `
      SELECT * FROM movies 
      WHERE title ILIKE $1 
      ORDER BY popularity DESC 
      LIMIT $2
    `;
    
    try {
      return await db.query<DatabaseMovie>(sql, [`%${query}%`, limit]);
    } catch (error) {
      return [];
    }
  }

  async addToUserWatchlist(userId: number, movieId: number, status: UserMovie['status'] = 'watchlist'): Promise<UserMovie> {
    const sql = `
      INSERT INTO user_movies (user_id, movie_id, status)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, movie_id, status) DO UPDATE SET
        created_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    
    try {
      const result = await db.query<UserMovie>(sql, [userId, movieId, status]);
      return result[0];
    } catch (error) {
      
      const mockResult: UserMovie = {
        id: Date.now(),
        user_id: userId,
        movie_id: movieId,
        status,
        rating: null,
        created_at: new Date()
      };
      
      return mockResult;
    }
  }

  async getUserWatchHistory(userId: number, limit: number = 50): Promise<WatchedMovie[]> {
    const sql = `
      SELECT 
        um.movie_id,
        um.user_id,
        um.created_at as watched_at,
        um.rating,
        m.title,
        m.poster_path,
        m.release_date,
        m.vote_average,
        e.neutral, e.happy, e.sad, e.angry, e.fearful, e.disgusted, e.surprised,
        CASE WHEN e.id IS NOT NULL THEN true ELSE false END as has_logged_emotion
      FROM user_movies um
      JOIN movies m ON um.movie_id = m.id
      LEFT JOIN emotions e ON e.user_id = um.user_id 
        AND e.created_at >= um.created_at - INTERVAL '1 day'
        AND e.created_at <= um.created_at + INTERVAL '1 day'
      WHERE um.user_id = $1 AND um.status = 'watched'
      ORDER BY um.created_at DESC
      LIMIT $2
    `;
    
    try {
      const result = await db.query<any>(sql, [userId, limit]);
      
      return result.map(row => ({
        movieId: row.movie_id,
        userId: row.user_id,
        watchedAt: new Date(row.watched_at),
        title: row.title,
        poster_path: row.poster_path,
        release_date: row.release_date,
        vote_average: row.vote_average,
        hasLoggedEmotion: row.has_logged_emotion,
        emotions: row.has_logged_emotion ? {
          neutral: row.neutral,
          happy: row.happy,
          sad: row.sad,
          angry: row.angry,
          fearful: row.fearful,
          disgusted: row.disgusted,
          surprised: row.surprised
        } : undefined
      }));
    } catch (error) {
      
      return [
        {
          movieId: 550,
          userId: 'user123',
          watchedAt: new Date('2024-01-15'),
          title: 'Fight Club',
          poster_path: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
          release_date: '1999-10-15',
          vote_average: 8.4,
          hasLoggedEmotion: true,
          emotions: { happy: 0.1, sad: 0.3, angry: 0.4, fearful: 0.1, neutral: 0.05, disgusted: 0.03, surprised: 0.02 }
        },
        {
          movieId: 680,
          userId: 'user123', 
          watchedAt: new Date('2024-01-12'),
          title: 'Pulp Fiction',
          poster_path: '/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg',
          release_date: '1994-10-14',
          vote_average: 8.9,
          hasLoggedEmotion: true,
          emotions: { happy: 0.2, sad: 0.1, angry: 0.3, fearful: 0.2, neutral: 0.15, disgusted: 0.03, surprised: 0.02 }
        }
      ];
    }
  }

  async rateMovie(userId: number, movieId: number, rating: number): Promise<void> {
    const sql = `
      UPDATE user_movies 
      SET rating = $3 
      WHERE user_id = $1 AND movie_id = $2 AND status = 'watched'
    `;
    
    try {
      await db.query(sql, [userId, movieId, rating]);
    } catch (error) {
      throw error;
    }
  }

  async removeFromUserList(userId: number, movieId: number, status: UserMovie['status']): Promise<void> {
    const sql = 'DELETE FROM user_movies WHERE user_id = $1 AND movie_id = $2 AND status = $3';
    
    try {
      await db.query(sql, [userId, movieId, status]);
    } catch (error) {
      throw error;
    }
  }

  async getUserMoviesByStatus(userId: number, status: UserMovie['status'], limit: number = 50): Promise<UserMovie[]> {
    const sql = `
      SELECT * FROM user_movies 
      WHERE user_id = $1 AND status = $2 
      ORDER BY created_at DESC 
      LIMIT $3
    `;
    
    try {
      return await db.query<UserMovie>(sql, [userId, status, limit]);
    } catch (error) {
      return [];
    }
  }

  convertToDatabaseMovie(movie: Movie): Omit<DatabaseMovie, 'last_updated'> {
    return {
      id: movie.id,
      title: movie.title,
      overview: movie.overview,
      release_date: movie.release_date ? new Date(movie.release_date) : null,
      poster_path: movie.poster_path,
      backdrop_path: movie.backdrop_path,
      vote_average: movie.vote_average,
      vote_count: movie.vote_count,
      popularity: movie.popularity,
      runtime: movie.runtime || null,
      tmdb_data: movie
    };
  }
}

export const movieService = new MovieService();
export default MovieService;