/**
 * Database Configuration
 * 
 * PostgreSQL database connection configuration and utilities.
 * Manages connection pooling, SSL settings for production,
 * and provides connection testing functionality.
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

/**
 * PostgreSQL connection pool with environment-specific SSL configuration.
 * Uses DATABASE_URL from environment variables and enables SSL for production.
 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

/**
 * Tests database connectivity by acquiring and releasing a connection.
 * Used for health checks and startup verification.
 * 
 * @throws {Error} If database connection fails
 * @returns Promise that resolves when connection is successful
 */
export const connectDB = async () => {
  try {
    const client = await pool.connect();
    console.log('Database connected successfully');
    client.release();
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
};

export default pool;