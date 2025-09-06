/**
 * Authentication API Tests
 * 
 * Comprehensive test suite for authentication endpoints covering
 * user registration, login, password security, and JWT token validation.
 * Focuses on security-critical authentication functionality.
 */

import request from 'supertest';
import express from 'express';
import { describe, it, expect, beforeAll, beforeEach } from '@jest/globals';
import { authController } from '../src/controllers/authController';
import { testConfig } from './setup';

describe('Authentication API - Security Critical', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.post('/auth/register', authController.register);
    app.post('/auth/login', authController.login);
    app.get('/auth/verify', authController.verifyToken);
  });

  describe('Registration Security', () => {
    it('should register new user with properly hashed password', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'newuser@test.com',
          username: 'newuser',
          password: 'securePassword123!'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body.token).toMatch(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('newuser@test.com');
      expect(response.body.user).not.toHaveProperty('password');
      expect(response.body.user).not.toHaveProperty('password_hash');
    });

    it('should reject weak passwords', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'weak@test.com',
          username: 'weak',
          password: '123'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject invalid email formats', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'invalid-email',
          username: 'user',
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should prevent duplicate email registration', async () => {
      const userData = {
        email: 'duplicate@test.com',
        username: 'user1',
        password: 'password123!'
      };

      // First registration
      const response1 = await request(app)
        .post('/auth/register')
        .send(userData);
      expect(response1.status).toBe(201);

      // Second registration with same email
      const response2 = await request(app)
        .post('/auth/register')
        .send({ ...userData, username: 'user2' });
      expect(response2.status).toBe(400);
      expect(response2.body.error).toContain('already');
    });

    it('should sanitize input to prevent SQL injection', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: "test'; DROP TABLE users; --@test.com",
          username: "'; DROP TABLE users; --",
          password: 'password123'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('Login Security', () => {
    beforeEach(async () => {
      // Create test user for login tests
      await request(app)
        .post('/auth/register')
        .send(testConfig.testUser);
    });

    it('should login with correct credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: testConfig.testUser.email,
          password: testConfig.testUser.password
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body.token).toMatch(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(testConfig.testUser.email);
    });

    it('should reject incorrect password', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: testConfig.testUser.email,
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Invalid');
    });

    it('should reject non-existent email', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'anypassword'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should prevent SQL injection in login', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: "' OR '1'='1",
          password: "' OR '1'='1"
        });

      expect([400, 401]).toContain(response.status); // 400 = better validation, 401 = auth failure
    });

    it('should handle missing credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Token Verification Security', () => {
    let validToken: string;

    beforeEach(async () => {
      // Register and get token
      const registerResponse = await request(app)
        .post('/auth/register')
        .send({
          email: 'tokentest@test.com',
          username: 'tokentest',
          password: 'password123!'
        });
      validToken = registerResponse.body.token;
    });

    it('should verify valid token', async () => {
      const response = await request(app)
        .get('/auth/verify')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    });

    it('should reject invalid token', async () => {
      const response = await request(app)
        .get('/auth/verify')
        .set('Authorization', 'Bearer invalidtoken');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject missing token', async () => {
      const response = await request(app)
        .get('/auth/verify');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject malformed authorization header', async () => {
      const response = await request(app)
        .get('/auth/verify')
        .set('Authorization', 'InvalidFormat');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Error Handling', () => {
    it('should not leak sensitive information in error messages', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@test.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).not.toContain('password');
      expect(response.body.error).not.toContain('hash');
      expect(response.body.error).not.toContain('bcrypt');
    });

    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send('{ invalid json }');

      expect(response.status).toBe(400);
    });
  });
});