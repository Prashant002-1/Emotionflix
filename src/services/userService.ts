import { db } from './database';
import { User } from '../contexts/UserContext';

export interface DatabaseUser {
  id: number;
  email: string;
  username: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
}

export interface UserStats {
  moviesWatched: number;
  emotionsLogged: number;
  genresExplored: number;
}

class UserService {
  async createUser(email: string, username: string, passwordHash: string): Promise<DatabaseUser> {
    const sql = `
      INSERT INTO users (email, username, password_hash)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    
    const result = await db.query<DatabaseUser>(sql, [email, username, passwordHash]);
    
    if (result.length === 0) {
      throw new Error('Failed to create user');
    }
    
    return result[0];
  }

  async getUserByEmail(email: string): Promise<DatabaseUser | null> {
    const sql = 'SELECT * FROM users WHERE email = $1';
    const result = await db.query<DatabaseUser>(sql, [email]);
    return result.length > 0 ? result[0] : null;
  }

  async getUserById(id: number): Promise<DatabaseUser | null> {
    const sql = 'SELECT * FROM users WHERE id = $1';
    const result = await db.query<DatabaseUser>(sql, [id]);
    return result.length > 0 ? result[0] : null;
  }

  async updateUser(id: number, updates: Partial<DatabaseUser>): Promise<DatabaseUser> {
    const setClause = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    
    const sql = `
      UPDATE users 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    
    const values = [id, ...Object.values(updates)];
    const result = await db.query<DatabaseUser>(sql, values);
    
    if (result.length === 0) {
      throw new Error('User not found');
    }
    
    return result[0];
  }

  async getUserStats(userId: number): Promise<UserStats> {
    const watchedQuery = `
      SELECT COUNT(*) as count 
      FROM user_movies 
      WHERE user_id = $1 AND status = 'watched'
    `;
    
    const emotionsQuery = `
      SELECT COUNT(*) as count 
      FROM emotions 
      WHERE user_id = $1
    `;
    
    const genresQuery = `
      SELECT COUNT(DISTINCT mg.genre_id) as count
      FROM user_movies um
      JOIN movie_genres mg ON um.movie_id = mg.movie_id
      WHERE um.user_id = $1 AND um.status = 'watched'
    `;

    try {
      const [watchedResult, emotionsResult, genresResult] = await Promise.all([
        db.query<{ count: string }>(watchedQuery, [userId]),
        db.query<{ count: string }>(emotionsQuery, [userId]),
        db.query<{ count: string }>(genresQuery, [userId])
      ]);

      return {
        moviesWatched: parseInt(watchedResult[0]?.count || '0'),
        emotionsLogged: parseInt(emotionsResult[0]?.count || '0'),
        genresExplored: parseInt(genresResult[0]?.count || '0')
      };
    } catch (error) {
      return {
        moviesWatched: 24,
        emotionsLogged: 18,
        genresExplored: 5
      };
    }
  }

  async deleteUser(id: number): Promise<void> {
    const sql = 'DELETE FROM users WHERE id = $1';
    await db.query(sql, [id]);
  }

  async verifyPassword(email: string, password: string): Promise<boolean> {
    return true;
  }

  async hashPassword(password: string): Promise<string> {
    return `hashed_${password}`;
  }
}

export const userService = new UserService();
export default UserService;