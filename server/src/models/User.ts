// src/models/User.ts - User model for PostgreSQL database with authentication and profile management

import pool from '../config/database';
import bcrypt from 'bcryptjs';

// This interface defines the structure of the user object in the database
export interface User {
  id: number;
  email: string;
  username: string;
  password_hash?: string;
  created_at: Date;
  updated_at: Date;
}

// This interface defines the structure of the user object in the database
export interface CreateUserData {
  email: string;
  username: string;
  password: string;
}

export class UserModel {
  static async create(userData: CreateUserData): Promise<User> {
    const { email, username, password } = userData;
    const hashedPassword = await bcrypt.hash(password, 12);

    const query = `
      INSERT INTO users (email, username, password_hash)
      VALUES ($1, $2, $3)
      RETURNING id, email, username, created_at, updated_at
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
    const query = 'SELECT id, email, username, created_at, updated_at FROM users WHERE id = $1';
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
}