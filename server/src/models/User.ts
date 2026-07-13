/**
 * User Model
 * 
 * Data model for user entities with authentication and profile management.
 * Handles user CRUD operations, password hashing, and authentication
 * against PostgreSQL database.
 */

import pool from '../config/database';
import bcrypt from 'bcryptjs';

/**
 * User entity structure as stored in the database.
 * Represents a registered user with authentication credentials.
 */
export interface User {
  /** User's unique identifier */
  id: number;
  /** User's email address (unique) */
  email: string;
  /** User's chosen username (unique) */
  username: string;
  /** Hashed password*/
  password_hash?: string;
  /** Account creation timestamp */
  created_at: Date;
  /** Last update timestamp */
  updated_at: Date;
  bio?: string;
}

/**
 * Data structure for creating new user accounts.
 * Contains plaintext password that will be hashed before storage.
 */
export interface CreateUserData {
  /** User's email address */
  email: string;
  /** Desired username */
  username: string;
  /** Plaintext password (will be hashed) */
  password: string;
}

/**
 * UserModel class providing static methods for user database operations.
 * Handles user creation, authentication, and profile management.
 */
export class UserModel {
  /**
   * Creates a new user account with hashed password.
   * 
   * @param userData - User registration data with plaintext password
   * @returns Promise resolving to created user (without password hash)
   * @throws {Error} If email or username already exists
   */
  static async create(userData: CreateUserData): Promise<User> {
    const { email, username, password } = userData;
    const hashedPassword = await bcrypt.hash(password, 12);

    const query = `
      INSERT INTO users (email, username, password_hash)
      VALUES ($1, $2, $3)
      RETURNING id, email, username, bio, created_at, updated_at
    `;

    const result = await pool.query(query, [email, username, hashedPassword]);
    return result.rows[0];
  }

  static async findByEmail(email: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0] || null;
  }

  static async findByUsername(username: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE username = $1';
    const result = await pool.query(query, [username]);
    return result.rows[0] || null;
  }

  static async findById(id: number): Promise<User | null> {
    const query = 'SELECT id, email, username, bio, created_at, updated_at FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  static async validatePassword(user: User, password: string): Promise<boolean> {
    if (!user.password_hash) return false;
    return bcrypt.compare(password, user.password_hash);
  }

  static async updatePassword(userId: number, newPassword: string): Promise<boolean> {
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    const query = `
      UPDATE users 
      SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `;
    
    const result = await pool.query(query, [hashedPassword, userId]);
    return (result.rowCount ?? 0) > 0;
  }

  static async updateBio(userId: number, bio: string): Promise<User | null> {
    const result = await pool.query(
      `UPDATE users SET bio = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2
       RETURNING id, email, username, bio, created_at, updated_at`,
      [bio, userId],
    );
    return result.rows[0] || null;
  }
}
