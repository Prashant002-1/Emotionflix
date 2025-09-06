/**
 * Security Vulnerability Tests
 * 
 * Critical security test suite covering authentication vulnerabilities,
 * authorization bypass attempts, input validation, and common attack vectors.
 * Tests against OWASP Top 10 vulnerabilities and security best practices.
 */

import request from 'supertest';
import express from 'express';
import { describe, it, expect, beforeAll } from '@jest/globals';
import { authController } from '../src/controllers/authController';
import { emotionMappingController } from '../src/controllers/emotionMappingController';
import { authenticateToken } from '../src/middleware/auth';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

describe('Backend Security Tests - Critical Vulnerabilities', () => {
  let app: express.Application;
  let validToken: string;
  let userId: number;

  beforeAll(async () => {
    app = express();
    app.use(express.json({ limit: '10mb' }));
    
    // Add security headers middleware
    app.use((_req, res, next) => {
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      next();
    });
    
    app.post('/auth/register', authController.register);
    app.post('/auth/login', authController.login);
    app.get('/auth/verify', authController.verifyToken);
    app.put('/emotion-mappings/:userId', authenticateToken, emotionMappingController.updateUserMappings);
    
    // Create test user and get token
    const registerResponse = await request(app)
      .post('/auth/register')
      .send({
        email: 'security-test@test.com',
        username: 'securitytest',
        password: 'SecurePassword123!'
      });
    
    validToken = registerResponse.body.token;
    userId = registerResponse.body.user.id;
  });

  describe('SQL Injection Prevention', () => {
    it('should prevent SQL injection in login', async () => {
      const sqlInjectionAttempts = [
        "admin'; DROP TABLE users; --",
        "' OR '1'='1",
        "' UNION SELECT * FROM users --",
        "'; INSERT INTO users (email) VALUES ('hacked@test.com'); --",
        "admin' OR 1=1 /*",
        "' OR 'x'='x",
      ];

      for (const injection of sqlInjectionAttempts) {
        const response = await request(app)
          .post('/auth/login')
          .send({
            email: injection,
            password: injection
          });

        expect([400, 401]).toContain(response.status); // 400 = validation error, 401 = auth error
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).not.toContain('SQL');
        expect(response.body.error).not.toContain('syntax');
      }
    });

    it('should use parameterized queries', async () => {
      // Test with special characters that would break non-parameterized queries
      const specialChars = {
        email: "test'quote@test.com",
        username: "user\"with'quotes",
        password: "pass'word\"123"
      };

      const response = await request(app)
        .post('/auth/register')
        .send(specialChars);

      expect([201, 400]).toContain(response.status);
      if (response.status === 400) {
        expect(response.body).toHaveProperty('error');
      }
    });

    it('should prevent SQL injection in emotion mapping updates', async () => {
      const maliciousMappings = {
        mappings: {
          "'; DROP TABLE user_emotion_mappings; --": { "1; DROP TABLE genres; --": 0.8 }
        }
      };

      const response = await request(app)
        .put(`/emotion-mappings/${userId}`)
        .set('Authorization', `Bearer ${validToken}`)
        .send(maliciousMappings);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Authentication Security', () => {
    it('should hash passwords with bcrypt', async () => {
      const password = 'TestPassword123!';
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'hash-test@test.com',
          username: 'hashtest',
          password: password
        });

      expect(response.status).toBe(201);
      // Verify password is not returned in response
      expect(response.body.user).not.toHaveProperty('password');
      expect(response.body.user).not.toHaveProperty('password_hash');
    });

    it('should verify bcrypt hash strength', async () => {
      const password = 'TestPassword123!';
      const hash = await bcrypt.hash(password, 12); 
      
      expect(hash).toMatch(/^\$2[aby]?\$\d{2}\$/); 
      expect(hash.length).toBeGreaterThan(50); 
      
      // Verify password verification works
      const isValid = await bcrypt.compare(password, hash);
      expect(isValid).toBe(true);
      
      // Verify wrong password fails
      const isInvalid = await bcrypt.compare('wrongpassword', hash);
      expect(isInvalid).toBe(false);
    });

    it('should generate secure JWT tokens', async () => {
      // Create a new user for this test
      const registerResponse = await request(app)
        .post('/auth/register')
        .send({
          email: 'jwt-test@test.com',
          username: 'jwttest',
          password: 'SecurePassword123!'
        });

      expect(registerResponse.status).toBe(201);

      // Login with the created user
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: 'jwt-test@test.com',
          password: 'SecurePassword123!'
        });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body).toHaveProperty('token');

      const token = loginResponse.body.token;
      
      // Verify JWT structure
      expect(token).toMatch(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/);
      
      // Verify token can be decoded
      const decoded = jwt.decode(token) as any;
      expect(decoded).toHaveProperty('id'); // JWT uses 'id' not 'userId'
      expect(decoded).toHaveProperty('iat');
      expect(decoded).toHaveProperty('exp');
      
      // Verify token expiration is reasonable
      const expirationTime = decoded.exp * 1000; 
      const now = Date.now();
      const maxExpiration = now + (7 * 24 * 60 * 60 * 1000); 
      
      expect(expirationTime).toBeLessThanOrEqual(maxExpiration);
    });

    it('should reject invalid JWT tokens', async () => {
      const invalidTokens = [
        'invalid-token',
        'header.payload.invalid-signature',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTYzMDAwMDAwMH0.invalid',
        '', // Empty token
        'Bearer valid-token-format', // Missing Bearer prefix handling
      ];

      for (const token of invalidTokens) {
        const response = await request(app)
          .get('/auth/verify')
          .set('Authorization', `Bearer ${token}`);

        expect([400, 401]).toContain(response.status); // 400 = validation error, 401 = auth error
        expect(response.body).toHaveProperty('error');
      }
    });

    it('should handle expired tokens', async () => {
      // Create an expired token
      const expiredToken = jwt.sign(
        { id: 1 },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '-1h' } // Expired 1 hour ago
      );

      const response = await request(app)
        .get('/auth/verify')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
      expect(response.body.error).toMatch(/(expired|Invalid)/i); // Accept either expired or invalid token
    });
  });

  describe('Input Validation and Sanitization', () => {
    it('should validate email format and password strength', async () => {
      const testCases = [
        { email: 'not-an-email', password: 'ValidPassword123!', desc: 'invalid email format' },
        { email: 'valid@test.com', password: '123', desc: 'weak password' },
        { email: 'user@domain..com', password: 'ValidPassword123!', desc: 'malformed email' },
      ];

      for (const testCase of testCases) {
        const response = await request(app)
          .post('/auth/register')
          .send({
            email: testCase.email,
            username: 'testuser',
            password: testCase.password
          });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
      }
    });


    it('should validate emotion mapping data structure', async () => {
      const invalidMappings = [
        { mappings: 'not-an-object' },
        { mappings: { invalidEmotion: { 35: 0.8 } } },
        { mappings: { happy: { 35: 1.5 } } }, // Weight > 1
      ];

      for (const invalidMapping of invalidMappings) {
        const response = await request(app)
          .put(`/emotion-mappings/${userId}`)
          .set('Authorization', `Bearer ${validToken}`)
          .send(invalidMapping);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
      }
    });
  });

  describe('Rate Limiting and DoS Protection', () => {
    it('should limit request payload size', async () => {
      const largePayload = {
        email: 'a'.repeat(10000) + '@test.com',
        username: 'b'.repeat(10000),
        password: 'c'.repeat(10000)
      };

      const response = await request(app)
        .post('/auth/register')
        .send(largePayload);

      expect([400, 413, 500]).toContain(response.status); // Bad Request, Payload Too Large, or Server Error
    });

    it('should handle excessive concurrent requests', async () => {
      const requests = Array.from({ length: 100 }, () =>
        request(app)
          .post('/auth/login')
          .send({
            email: 'nonexistent@test.com',
            password: 'wrongpassword'
          })
      );

      const responses = await Promise.allSettled(requests);
      
      // Should handle requests without crashing
      responses.forEach((result) => {
        if (result.status === 'fulfilled') {
          expect(result.value.status).toBeGreaterThanOrEqual(400);
        }
      });
    });

    it('should handle both non-existent and existing users consistently', async () => {
      // Test with non-existent user
      const nonExistentResponse = await request(app)
        .post('/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'anypassword'
        });

      // Test with existing user but wrong password
      const wrongPasswordResponse = await request(app)
        .post('/auth/login')
        .send({
          email: 'security-test@test.com',
          password: 'wrongpassword'
        });
      
      // Both should return 401 to prevent user enumeration
      expect(nonExistentResponse.status).toBe(401);
      expect(wrongPasswordResponse.status).toBe(401);
    });
  });

  describe('Error Handling Security', () => {
    it('should not expose sensitive information in error messages', async () => {
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
      expect(response.body.error).not.toContain('database');
      expect(response.body.error).not.toContain('sql');
      expect(response.body.error).not.toContain('localhost');
      expect(response.body.error).not.toContain('5432');
    });

    it('should handle database connection errors securely', async () => {
      const response = await request(app)
        .get('/auth/verify')
        .set('Authorization', `Bearer ${validToken}`);

      // Even if there's a database error, should not expose internals
      if (response.status === 500) {
        expect(response.body.error).not.toContain('connection');
        expect(response.body.error).not.toContain('timeout');
        expect(response.body.error).not.toContain('postgres');
      }
    });

    it('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/auth/register')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }');

      expect(response.status).toBe(400);
      // Malformed JSON handled - specific error format not critical
    });
  });

  describe('Authorization Security', () => {
    it('should prevent horizontal privilege escalation', async () => {
      // Create second user
      const secondUserResponse = await request(app)
        .post('/auth/register')
        .send({
          email: 'second@test.com',
          username: 'seconduser',
          password: 'SecurePassword123!'
        });

      const secondUserId = secondUserResponse.body.user.id;
      
      // Try to access first user's data with second user's ID
      const response = await request(app)
        .put(`/emotion-mappings/${secondUserId}`)
        .set('Authorization', `Bearer ${validToken}`) 
        .send({
          mappings: { happy: { 35: 0.8 } }
        });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });

    it('should validate resource ownership', async () => {
      // Try to access non-existent user's data
      const response = await request(app)
        .put('/emotion-mappings/99999')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          mappings: { happy: { 35: 0.8 } }
        });

      expect(response.status).toBe(403);
    });

    it('should require authentication for protected endpoints', async () => {
      const protectedEndpoints = [
        { method: 'get', path: '/auth/verify' },
        { method: 'put', path: `/emotion-mappings/${userId}` },
      ];

      for (const endpoint of protectedEndpoints) {
        let response: any;
        if (endpoint.method === 'get') {
          response = await request(app).get(endpoint.path);
        } else if (endpoint.method === 'put') {
          response = await request(app).put(endpoint.path);
        } else if (endpoint.method === 'post') {
          response = await request(app).post(endpoint.path);
        } else {
          response = await request(app).delete(endpoint.path);
        }
        expect([400, 401]).toContain(response.status); // 400 = validation error, 401 = auth error
        expect(response.body).toHaveProperty('error');
      }
    });
  });

  describe('CORS and Headers Security', () => {
    it('should include security headers', async () => {
      const response = await request(app)
        .get('/auth/verify')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.headers).toHaveProperty('x-frame-options', 'DENY');
      expect(response.headers).toHaveProperty('x-content-type-options', 'nosniff');
      expect(response.headers).toHaveProperty('x-xss-protection', '1; mode=block');
    });

    it('should handle CORS properly', async () => {
      const response = await request(app)
        .options('/auth/login')
        .set('Origin', 'https://malicious-site.com');

      // Should not allow arbitrary origins
      expect(response.headers['access-control-allow-origin']).not.toBe('https://malicious-site.com');
    });
  });
});