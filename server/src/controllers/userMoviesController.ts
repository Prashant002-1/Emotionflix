// src/controllers/userMoviesController.ts - Controller for user movie data (watchlist, favorites, watched)

import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { z } from 'zod';
import pool from '../config/database';
import { getMovieDetails, TMDBMovie } from '../services/tmdbService';

const VALID_STATUSES = ['watchlist', 'watched', 'favorite'] as const;

const addMovieSchema = z.object({
  movieId: z.number().positive('Movie ID must be positive'),
  status: z.enum(VALID_STATUSES, {
    errorMap: () => ({ message: 'Status must be one of: watchlist, watched, favorite' })
  }),
  rating: z.number().min(1).max(10).optional(),
  emotions: z.record(z.number()).optional(), // Emotion scores if logged
  confidence: z.number().min(0).max(1).optional() // Confidence level 0-1
});

const updateMovieSchema = z.object({
  status: z.enum(VALID_STATUSES).optional(),
  rating: z.number().min(1).max(10).optional(),
  emotions: z.record(z.number()).optional()
});

export const getUserMovies = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { status } = req.query;
    const userId = req.user.id;

    let query = `
      SELECT 
        um.*, 
        m.title, 
        m.poster_path, 
        m.release_date, 
        CAST(m.vote_average AS FLOAT) as vote_average, 
        m.overview,
        e.neutral,
        e.happy,
        e.sad,
        e.angry,
        e.fearful,
        e.disgusted,
        e.surprised,
        e.confidence,
        e.detection_method,
        e.created_at as emotion_created_at
      FROM user_movies um
      JOIN movies m ON um.movie_id = m.id
      LEFT JOIN emotions e ON e.user_id = um.user_id 
        AND e.created_at BETWEEN um.created_at - INTERVAL '5 minutes' AND um.created_at + INTERVAL '5 minutes'
      WHERE um.user_id = $1
    `;
    const params: any[] = [userId];

    if (status && VALID_STATUSES.includes(status as any)) {
      query += ' AND um.status = $2';
      params.push(status);
    }

    query += ' ORDER BY um.created_at DESC';

    const result = await pool.query(query, params);
    
    res.json({
      movies: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching user movies:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const addUserMovie = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const validatedData = addMovieSchema.parse(req.body);
    const { movieId, status, rating, emotions, confidence } = validatedData;
    const userId = req.user.id;

    let movieQuery = 'SELECT id FROM movies WHERE id = $1';
    let movieResult = await pool.query(movieQuery, [movieId]);
    
    if (movieResult.rows.length === 0) {
      try {
        const tmdbMovie = await getMovieDetails(movieId);
        
        const insertMovieQuery = `
          INSERT INTO movies (id, title, overview, release_date, poster_path, backdrop_path, vote_average, vote_count, popularity, tmdb_data)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            overview = EXCLUDED.overview,
            release_date = EXCLUDED.release_date,
            poster_path = EXCLUDED.poster_path,
            backdrop_path = EXCLUDED.backdrop_path,
            vote_average = EXCLUDED.vote_average,
            vote_count = EXCLUDED.vote_count,
            popularity = EXCLUDED.popularity,
            tmdb_data = EXCLUDED.tmdb_data,
            last_updated = CURRENT_TIMESTAMP
        `;
        
        await pool.query(insertMovieQuery, [
          tmdbMovie.id,
          tmdbMovie.title,
          tmdbMovie.overview,
          tmdbMovie.release_date,
          tmdbMovie.poster_path,
          tmdbMovie.backdrop_path,
          tmdbMovie.vote_average,
          tmdbMovie.vote_count,
          tmdbMovie.popularity,
          JSON.stringify(tmdbMovie)
        ]);

        if (tmdbMovie.genre_ids && tmdbMovie.genre_ids.length > 0) {
          for (const genreId of tmdbMovie.genre_ids) {
            await pool.query(`
              INSERT INTO movie_genres (movie_id, genre_id)
              VALUES ($1, $2)
              ON CONFLICT (movie_id, genre_id) DO NOTHING
            `, [movieId, genreId]);
          }
        }
      } catch (tmdbError) {
        console.error('Error fetching movie from TMDB:', tmdbError);
        return res.status(404).json({ error: 'Movie not found in TMDB' });
      }
    }

    // Check if user already has this movie with this status
    const existingQuery = 'SELECT id FROM user_movies WHERE user_id = $1 AND movie_id = $2 AND status = $3';
    const existingResult = await pool.query(existingQuery, [userId, movieId, status]);
    
    if (existingResult.rows.length > 0) {
      return res.status(409).json({ error: 'Movie already exists in this list' });
    }

    // Insert the movie
    const insertQuery = `
      INSERT INTO user_movies (user_id, movie_id, status, rating, created_at)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      RETURNING *
    `;
    
    const insertResult = await pool.query(insertQuery, [userId, movieId, status, rating || null]);
    
    // If emotions were provided, store them in the emotions table
    if (emotions && Object.keys(emotions).length > 0) {
      const emotionQuery = `
        INSERT INTO emotions (user_id, neutral, happy, sad, angry, fearful, disgusted, surprised, detection_method, confidence)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'manual', $9)
        RETURNING id
      `;
      
      await pool.query(emotionQuery, [
        userId,
        emotions.neutral || 0,
        emotions.happy || 0,
        emotions.sad || 0,
        emotions.angry || 0,
        emotions.fearful || 0,
        emotions.disgusted || 0,
        emotions.surprised || 0,
        confidence || 1.0 // Use provided confidence or default to 1.0 for manual input
      ]);
    }

    res.status(201).json({
      message: 'Movie added successfully',
      movie: insertResult.rows[0]
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    
    console.error('Error adding user movie:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateUserMovie = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { movieId } = req.params;
    const validatedData = updateMovieSchema.parse(req.body);
    const userId = req.user.id;

    const movieIdNum = parseInt(movieId);
    if (isNaN(movieIdNum)) {
      return res.status(400).json({ error: 'Invalid movie ID' });
    }

    // Check if the user has this movie
    const existingQuery = 'SELECT id FROM user_movies WHERE user_id = $1 AND movie_id = $2';
    const existingResult = await pool.query(existingQuery, [userId, movieIdNum]);
    
    if (existingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Movie not found in user lists' });
    }

    // Build update query dynamically
    const updates: string[] = [];
    const params: any[] = [userId, movieIdNum];
    let paramIndex = 3;

    if (validatedData.status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      params.push(validatedData.status);
    }

    if (validatedData.rating !== undefined) {
      updates.push(`rating = $${paramIndex++}`);
      params.push(validatedData.rating);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const updateQuery = `
      UPDATE user_movies 
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1 AND movie_id = $2
      RETURNING *
    `;

    const result = await pool.query(updateQuery, params);
    
    res.json({
      message: 'Movie updated successfully',
      movie: result.rows[0]
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    
    console.error('Error updating user movie:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const removeUserMovie = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { movieId } = req.params;
    const userId = req.user.id;

    const movieIdNum = parseInt(movieId);
    if (isNaN(movieIdNum)) {
      return res.status(400).json({ error: 'Invalid movie ID' });
    }

    const deleteQuery = 'DELETE FROM user_movies WHERE user_id = $1 AND movie_id = $2 RETURNING *';
    const result = await pool.query(deleteQuery, [userId, movieIdNum]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Movie not found in user lists' });
    }

    res.json({
      message: 'Movie removed successfully',
      movie: result.rows[0]
    });
  } catch (error) {
    console.error('Error removing user movie:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUserStats = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userId = req.user.id;

    // Get movie counts by status
    const statsQuery = `
      SELECT 
        status,
        COUNT(*) as count
      FROM user_movies 
      WHERE user_id = $1 
      GROUP BY status
    `;
    
    const statsResult = await pool.query(statsQuery, [userId]);

    // Get emotion statistics
    const emotionQuery = `
      SELECT 
        COUNT(*) as total_emotions,
        AVG(confidence) as avg_confidence
      FROM emotions 
      WHERE user_id = $1
    `;
    
    const emotionResult = await pool.query(emotionQuery, [userId]);

    // Calculate favorite emotion
    const favoriteEmotionQuery = `
      SELECT 
        CASE 
          WHEN neutral > happy AND neutral > sad AND neutral > angry AND neutral > fearful AND neutral > disgusted AND neutral > surprised THEN 'neutral'
          WHEN happy > sad AND happy > angry AND happy > fearful AND happy > disgusted AND happy > surprised THEN 'happy'
          WHEN sad > angry AND sad > fearful AND sad > disgusted AND sad > surprised THEN 'sad'
          WHEN angry > fearful AND angry > disgusted AND angry > surprised THEN 'angry'
          WHEN fearful > disgusted AND fearful > surprised THEN 'fearful'
          WHEN disgusted > surprised THEN 'disgusted'
          ELSE 'surprised'
        END as dominant_emotion,
        COUNT(*) as count
      FROM emotions 
      WHERE user_id = $1
      GROUP BY dominant_emotion
      ORDER BY count DESC
      LIMIT 1
    `;
    
    const favoriteEmotionResult = await pool.query(favoriteEmotionQuery, [userId]);

    const stats = {
      movies: {
        watchlist: 0,
        watched: 0,
        favorite: 0,
        total: 0
      },
      emotions: {
        total: emotionResult.rows[0]?.total_emotions || 0,
        averageConfidence: emotionResult.rows[0]?.avg_confidence || 0,
        favoriteEmotion: favoriteEmotionResult.rows[0]?.dominant_emotion || 'neutral'
      }
    };

    // Populate movie stats
    statsResult.rows.forEach(row => {
      stats.movies[row.status as keyof typeof stats.movies] = parseInt(row.count);
      stats.movies.total += parseInt(row.count);
    });

    res.json(stats);
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
