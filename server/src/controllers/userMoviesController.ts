/**
 * User Movies Controller
 * 
 * Manages user movie interactions including watchlist and watch history.
 * Handles CRUD operations for user movies with emotion data, integrates
 * with TMDB API for movie details, and updates user emotional profiles.
 */

import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { z } from 'zod';
import pool from '../config/database';
import { getMovieDetails } from '../services/tmdbService';

const VALID_STATUSES = ['watchlist', 'watched'] as const;

/**
 * Updates user's emotional profile based on their recent emotion history.
 * Calculates average emotions from last 10 entries and updates user profile.
 * 
 * @param userId - ID of the user whose profile to update
 * @param emotions - New emotion data to contribute to the profile
 */
const updateUserEmotionalProfile = async (userId: number, emotions: Record<string, number>) => {
  try {
    // Calculate average emotions from user's recent emotion history (last 10 emotions)
    const avgEmotionsQuery = `
      SELECT 
        AVG(neutral) as avg_neutral,
        AVG(happy) as avg_happy,
        AVG(sad) as avg_sad,
        AVG(angry) as avg_angry,
        AVG(fearful) as avg_fearful,
        AVG(disgusted) as avg_disgusted,
        AVG(surprised) as avg_surprised
      FROM (
        SELECT neutral, happy, sad, angry, fearful, disgusted, surprised
        FROM emotions 
        WHERE user_id = $1 
        ORDER BY created_at DESC 
        LIMIT 10
      ) recent_emotions
    `;
    
    const avgResult = await pool.query(avgEmotionsQuery, [userId]);
    const avgEmotions = avgResult.rows[0] || {
      avg_neutral: 0, avg_happy: 0, avg_sad: 0, avg_angry: 0, 
      avg_fearful: 0, avg_disgusted: 0, avg_surprised: 0
    };

    // Upsert user's emotional profile
    const upsertQuery = `
      INSERT INTO user_emotion_profiles (user_id, neutral, happy, sad, angry, fearful, disgusted, surprised, last_updated)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id) DO UPDATE SET
        neutral = EXCLUDED.neutral,
        happy = EXCLUDED.happy,
        sad = EXCLUDED.sad,
        angry = EXCLUDED.angry,
        fearful = EXCLUDED.fearful,
        disgusted = EXCLUDED.disgusted,
        surprised = EXCLUDED.surprised,
        last_updated = CURRENT_TIMESTAMP
    `;
    
    await pool.query(upsertQuery, [
      userId,
      avgEmotions.avg_neutral || 0,
      avgEmotions.avg_happy || 0,
      avgEmotions.avg_sad || 0,
      avgEmotions.avg_angry || 0,
      avgEmotions.avg_fearful || 0,
      avgEmotions.avg_disgusted || 0,
      avgEmotions.avg_surprised || 0
    ]);
  } catch (error) {
    console.error('Error updating user emotional profile:', error);
  }
};

const addMovieSchema = z.object({
  movieId: z.number().positive('Movie ID must be positive'),
  status: z.enum(VALID_STATUSES, {
    errorMap: () => ({ message: 'Status must be one of: watchlist, watched' })
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
        CAST(e.neutral AS FLOAT) as neutral,
        CAST(e.happy AS FLOAT) as happy,
        CAST(e.sad AS FLOAT) as sad,
        CAST(e.angry AS FLOAT) as angry,
        CAST(e.fearful AS FLOAT) as fearful,
        CAST(e.disgusted AS FLOAT) as disgusted,
        CAST(e.surprised AS FLOAT) as surprised,
        CAST(e.confidence AS FLOAT) as confidence,
        e.detection_method,
        e.created_at as emotion_created_at
      FROM user_movies um
      JOIN movies m ON um.movie_id = m.id
      LEFT JOIN emotions e ON e.user_id = um.user_id 
        AND e.movie_id = um.movie_id
        AND e.created_at BETWEEN um.created_at - INTERVAL '2 minutes' AND um.created_at + INTERVAL '2 minutes'
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
    
    // If emotions were provided, store them in the emotions table with movie_id
    if (emotions && Object.keys(emotions).length > 0) {
      const emotionQuery = `
        INSERT INTO emotions (user_id, movie_id, neutral, happy, sad, angry, fearful, disgusted, surprised, detection_method, confidence, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'manual', $10, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id, movie_id, created_at) DO UPDATE SET
          neutral = EXCLUDED.neutral,
          happy = EXCLUDED.happy,
          sad = EXCLUDED.sad,
          angry = EXCLUDED.angry,
          fearful = EXCLUDED.fearful,
          disgusted = EXCLUDED.disgusted,
          surprised = EXCLUDED.surprised,
          confidence = EXCLUDED.confidence
        RETURNING id
      `;
      
      await pool.query(emotionQuery, [
        userId,
        movieId,
        emotions.neutral || 0,
        emotions.happy || 0,
        emotions.sad || 0,
        emotions.angry || 0,
        emotions.fearful || 0,
        emotions.disgusted || 0,
        emotions.surprised || 0,
        confidence || 1.0 // Use provided confidence or default to 1.0 for manual input
      ]);

      // Update user's emotional profile with the new emotions
      await updateUserEmotionalProfile(userId, emotions);
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
    const { status } = req.query; // Get status from query params
    const userId = req.user.id;

    const movieIdNum = parseInt(movieId);
    if (isNaN(movieIdNum)) {
      return res.status(400).json({ error: 'Invalid movie ID' });
    }

    // Validate status parameter
    if (!status || !VALID_STATUSES.includes(status as any)) {
      return res.status(400).json({ error: 'Status parameter is required and must be one of: watchlist, watched' });
    }

    const deleteQuery = 'DELETE FROM user_movies WHERE user_id = $1 AND movie_id = $2 AND status = $3 RETURNING *';
    const result = await pool.query(deleteQuery, [userId, movieIdNum, status]);
    
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

    // Calculate favorite emotion - find the most recurring emotion
    const favoriteEmotionQuery = `
      SELECT 
        emotion_type,
        COUNT(*) as occurrence_count
      FROM (
        SELECT 'neutral' as emotion_type FROM emotions WHERE user_id = $1 AND neutral > 0.1
        UNION ALL
        SELECT 'happy' as emotion_type FROM emotions WHERE user_id = $1 AND happy > 0.1
        UNION ALL
        SELECT 'sad' as emotion_type FROM emotions WHERE user_id = $1 AND sad > 0.1
        UNION ALL
        SELECT 'angry' as emotion_type FROM emotions WHERE user_id = $1 AND angry > 0.1
        UNION ALL
        SELECT 'fearful' as emotion_type FROM emotions WHERE user_id = $1 AND fearful > 0.1
        UNION ALL
        SELECT 'disgusted' as emotion_type FROM emotions WHERE user_id = $1 AND disgusted > 0.1
        UNION ALL
        SELECT 'surprised' as emotion_type FROM emotions WHERE user_id = $1 AND surprised > 0.1
      ) emotion_data
      GROUP BY emotion_type
      ORDER BY occurrence_count DESC
      LIMIT 1
    `;
    
    const favoriteEmotionResult = await pool.query(favoriteEmotionQuery, [userId]);

    const stats = {
      movies: {
        watchlist: 0,
        watched: 0,
        total: 0
      },
      emotions: {
        total: emotionResult.rows[0]?.total_emotions || 0,
        averageConfidence: emotionResult.rows[0]?.avg_confidence || 0,
        favoriteEmotion: favoriteEmotionResult.rows[0]?.emotion_type || 'neutral'
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

export const getUserEmotionalProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userId = req.user.id;

    // Get user's current emotional profile
    const profileQuery = `
      SELECT neutral, happy, sad, angry, fearful, disgusted, surprised, last_updated
      FROM user_emotion_profiles 
      WHERE user_id = $1
    `;
    
    const profileResult = await pool.query(profileQuery, [userId]);
    
    if (profileResult.rows.length === 0) {
      // Return default emotions if no profile exists
      return res.json({
        neutral: 0.2,
        happy: 0.3,
        sad: 0.1,
        angry: 0.1,
        fearful: 0.1,
        disgusted: 0.05,
        surprised: 0.15,
        last_updated: null
      });
    }

    res.json(profileResult.rows[0]);
  } catch (error) {
    console.error('Error fetching user emotional profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
