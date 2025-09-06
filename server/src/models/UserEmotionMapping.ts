/**
 * User Emotion Mapping Model
 * 
 * Data model for user-specific emotion-to-genre mappings that enable
 * personalized movie recommendations. Tracks how individual users'
 * emotions correlate with their movie genre preferences over time.
 */

import pool from '../config/database';

/**
 * Individual emotion-to-genre mapping record in the database.
 * Represents a single user's association between an emotion and a movie genre.
 */
export interface UserEmotionMapping {
  /** Unique mapping record identifier */
  id: number;
  /** ID of the user this mapping belongs to */
  user_id: number;
  /** Emotion name (e.g., 'happy', 'sad', 'angry') */
  emotion: string;
  /** TMDB genre ID */
  genre_id: number;
  /** Strength of emotion-genre association (0.0 to 1.0) */
  weight: number;
  /** When this mapping was created */
  created_at: Date;
  /** When this mapping was last updated */
  updated_at: Date;
}

/**
 * Nested mapping structure for efficient emotion-genre lookups.
 * Organizes mappings by emotion type and genre ID for quick access.
 */
export interface PersonalizedMapping {
  /** Maps emotion names to their genre associations */
  [emotion: string]: { 
    /** Maps genre IDs to their weights for this emotion */
    [genreId: number]: number 
  };
}

/**
 * UserEmotionMappingModel class providing static methods for emotion mapping operations.
 * Handles retrieval, updates, and management of user-specific emotion-genre associations.
 */
export class UserEmotionMappingModel {
  /**
   * Retrieves all emotion-to-genre mappings for a specific user.
   * 
   * @param userId - ID of the user whose mappings to retrieve
   * @returns Promise resolving to organized mapping structure
   */
  static async getUserMappings(userId: number): Promise<PersonalizedMapping> {
    const query = `
      SELECT emotion, genre_id, weight 
      FROM user_emotion_mappings 
      WHERE user_id = $1
    `;

    const result = await pool.query(query, [userId]);
    const mappings: PersonalizedMapping = {};

    result.rows.forEach(row => {
      if (!mappings[row.emotion]) {
        mappings[row.emotion] = {};
      }
      mappings[row.emotion][row.genre_id] = parseFloat(row.weight);
    });

    return mappings;
  }

  static async upsertUserMappings(userId: number, mappings: PersonalizedMapping): Promise<void> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Delete existing mappings for this user
      await client.query('DELETE FROM user_emotion_mappings WHERE user_id = $1', [userId]);

      // Insert new mappings
      for (const [emotion, genreWeights] of Object.entries(mappings)) {
        for (const [genreIdStr, weight] of Object.entries(genreWeights)) {
          const genreId = parseInt(genreIdStr);
          if (weight > 0.001) { // Only store meaningful weights
            await client.query(`
              INSERT INTO user_emotion_mappings (user_id, emotion, genre_id, weight, updated_at)
              VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
            `, [userId, emotion, genreId, weight]);
          }
        }
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async updateUserMapping(
    userId: number,
    emotion: string,
    genreId: number,
    weight: number
  ): Promise<void> {
    const query = `
      INSERT INTO user_emotion_mappings (user_id, emotion, genre_id, weight, updated_at)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id, emotion, genre_id)
      DO UPDATE SET 
        weight = EXCLUDED.weight,
        updated_at = CURRENT_TIMESTAMP
    `;

    await pool.query(query, [userId, emotion, genreId, weight]);
  }

  /**
   * Delete a specific emotion-genre mapping for a user.
   * Useful for allowing users to remove specific preferences.
   * @param userId The user's ID
   * @param emotion The emotion name  
   * @param genreId The genre ID to remove
   */
  static async deleteUserMapping(
    userId: number, 
    emotion: string, 
    genreId: number
  ): Promise<void> {
    const query = `
      DELETE FROM user_emotion_mappings 
      WHERE user_id = $1 AND emotion = $2 AND genre_id = $3
    `;
    
    await pool.query(query, [userId, emotion, genreId]);
  }

  static async deleteUserMappings(userId: number): Promise<void> {
    await pool.query('DELETE FROM user_emotion_mappings WHERE user_id = $1', [userId]);
  }
}