/**
 * Test Environment Setup
 * 
 * Global test configuration and setup utilities for Jest test suite.
 * Initializes test database, loads environment variables, and provides
 * shared test utilities and configuration across all test files.
 */

import dotenv from 'dotenv';
import { expect, jest, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { setupTestDatabase, cleanupTestDatabase } from './setup-test-db';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Global test setup
beforeAll(async () => {
  console.log('Setting up test environment...');
  
  try {
    await setupTestDatabase();
    console.log('✅ Test database initialized successfully');
    
    // Clean database before each test file to avoid conflicts
    await cleanupTestDatabase();
    console.log('✅ Test database cleared for fresh start');
  } catch (error) {
    console.error('❌ Failed to setup test database:', error);
    throw error;
  }
});

afterAll(async () => {
  console.log('Cleaning up test environment...');
  
  try {
    await cleanupTestDatabase();
  } catch (error) {
    console.error('Error cleaning up test database:', error);
  }
});

// Mock console for cleaner test output
const originalConsole = console;
beforeEach(() => {
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterEach(() => {
  console.error = originalConsole.error;
  console.warn = originalConsole.warn;
});

// Extend Jest matchers for better assertions
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidJWT(): R;
      toBeValidEmail(): R;
    }
  }
}

expect.extend({
  toBeValidJWT(received: string) {
    const jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/;
    const pass = jwtRegex.test(received);
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid JWT`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid JWT`,
        pass: false,
      };
    }
  },
  
  toBeValidEmail(received: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const pass = emailRegex.test(received);
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid email`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid email`,
        pass: false,
      };
    }
  },
});

// Test utilities
export const testConfig = {
  testUser: {
    email: 'test@test.com',
    username: 'testuser',
    password: 'testpassword123!'
  },
  testEmotion: {
    neutral: 0.1,
    happy: 0.7,
    sad: 0.1,
    angry: 0.05,
    fearful: 0.03,
    disgusted: 0.01,
    surprised: 0.01
  }
};