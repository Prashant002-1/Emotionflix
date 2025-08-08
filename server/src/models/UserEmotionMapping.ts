// src/models/UserEmotionMapping.ts - Model for user personalized emotion-to-genre mappings

import pool from '../config/database';

export interface UserEmotionMapping {
  id: number;
  user_id: number;
  emotion: string;
  genre_id: number;
  weight: number;
  created_at: Date;
  updated_at: Date;
}

export interface PersonalizedMapping {
  [emotion: string]: { [genreId: number]: number };
}

export class UserEmotionMappingModel {
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

  static async deleteUserMappings(userId: number): Promise<void> {
    await pool.query('DELETE FROM user_emotion_mappings WHERE user_id = $1', [userId]);
  }
}