/**
 * Test Database Setup Utilities
 * 
 * Provides database initialization and cleanup utilities for Jest test suite.
 * Handles test database creation, schema application, and data cleanup
 * to ensure isolated and consistent test environments.
 */

import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

/**
 * Creates database connection configuration from environment variables
 * 
 * Parses DATABASE_URL or uses default test database connection parameters
 * to create PostgreSQL connection configuration objects.
 * 
 * @param database - Optional database name override
 * @returns PostgreSQL connection configuration object
 */
const createDbConfig = (database?: string) => {
  const url = new URL(process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/test_emotionflix');
  
  return {
    host: url.hostname,
    port: parseInt(url.port) || 5432,
    user: url.username,
    password: url.password,
    database: database || url.pathname.slice(1) // Remove leading '/' from pathname
  };
};

/**
 * Sets up the test database environment
 * 
 * Creates test database if it doesn't exist, applies database schema,
 * and verifies that all required tables are present and accessible.
 * 
 * @throws Error if database setup fails or required tables are missing
 */
const setupTestDatabase = async () => {
  // Connect to postgres (default database) to create test database if it doesn't exist
  const adminConfig = createDbConfig('postgres');
  const adminPool = new Pool(adminConfig);

  // Connect to the test database
  const testConfig = createDbConfig();
  const testPool = new Pool(testConfig);

  try {
    // Create test database if it doesn't exist
    try {
      await adminPool.query('CREATE DATABASE test_emotionflix');
      console.log('Created test_emotionflix database');
    } catch (error: any) {
      if (error.code === '42P04') {
        console.log('test_emotionflix database already exists');
      } else {
        throw error;
      }
    }

    // Apply schema to test database
    const schemaPath = path.join(__dirname, '../../database/schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    await testPool.query(schemaSql);
    console.log('Applied schema to test_emotionflix database');

    // Verify critical tables exist
    const result = await testPool.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename IN ('users', 'user_emotion_mappings', 'genres')
    `);
    
    console.log('Available tables:', result.rows.map(row => row.tablename));
    
    if (result.rows.length >= 3) {
      console.log('✅ Test database setup complete');
    } else {
      throw new Error('❌ Missing required tables in test database');
    }

  } finally {
    await adminPool.end();
    await testPool.end();
  }
};

/**
 * Cleans up test database by removing all test data
 * 
 * Clears all data from test tables while preserving the database schema
 * to ensure clean state between test runs.
 * 
 * @throws Logs errors but continues execution if cleanup fails
 */
const cleanupTestDatabase = async () => {
  // Clean up any open database connections
  const testConfig = createDbConfig();
  const testPool = new Pool(testConfig);

  try {
    // Clear test data but keep schema
    await testPool.query('DELETE FROM user_emotion_mappings');
    await testPool.query('DELETE FROM users');
    console.log('✅ Test database cleaned up');
  } catch (error) {
    console.error('Error cleaning up test database:', error);
  } finally {
    await testPool.end();
  }
};

export { setupTestDatabase, cleanupTestDatabase };