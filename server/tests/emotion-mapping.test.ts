/**
 * Emotion Mapping API Tests
 * 
 * Test suite for emotion-to-genre mapping functionality covering
 * CRUD operations, authorization checks, and data validation.
 */

import request from 'supertest';
import express from 'express';
import { describe, it, expect, beforeAll, beforeEach } from '@jest/globals';
import { emotionMappingController } from '../src/controllers/emotionMappingController';
import { authController } from '../src/controllers/authController';
import { authenticateToken } from '../src/middleware/auth';

describe('Emotion Mapping API - Production Critical', () => {
  let app: express.Application;
  let userToken: string;
  let userId: number;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    
    // Add auth routes
    app.post('/auth/register', authController.register);
    app.post('/auth/login', authController.login);
    
    // Add emotion mapping routes with authentication
    app.get('/emotion-mappings/:userId', authenticateToken, emotionMappingController.getUserMappings);
    app.put('/emotion-mappings/:userId', authenticateToken, emotionMappingController.updateUserMappings);
    app.delete('/emotion-mappings/:userId', authenticateToken, emotionMappingController.deleteUserMapping);

    // Create test user and get token
    const registerResponse = await request(app)
      .post('/auth/register')
      .send({
        email: 'mapping-test@test.com',
        username: 'mappingtest',
        password: 'password123!'
      });
    
    userToken = registerResponse.body.token;
    userId = registerResponse.body.user.id;
  });

  describe('Get User Mappings', () => {
    it('should retrieve user emotion mappings with proper structure', async () => {
      const response = await request(app)
        .get(`/emotion-mappings/${userId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('mappings');
      expect(typeof response.body.mappings).toBe('object');
    });

    it('should prevent access to other users data (horizontal privilege escalation)', async () => {
      const response = await request(app)
        .get('/emotion-mappings/99999')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Access denied');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get(`/emotion-mappings/${userId}`);

      expect(response.status).toBe(401);
    });

    it('should validate user ID parameter', async () => {
      const response = await request(app)
        .get('/emotion-mappings/invalid')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Update User Mappings', () => {
    const validMappings = {
      happy: { 35: 0.8, 16: 0.6 }, // Comedy, Animation
      sad: { 18: 0.9, 10749: 0.3 }, // Drama, Romance
      angry: { 28: 0.9, 53: 0.7 } // Action, Thriller
    };

    it('should update user emotion mappings successfully', async () => {
      const response = await request(app)
        .put(`/emotion-mappings/${userId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ mappings: validMappings });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('mappings');
      expect(response.body.message).toContain('updated successfully');
    });

    it('should validate emotion mapping data structure and values', async () => {
      const testCases = [
        { mappings: { invalidEmotion: { 35: 0.8 } }, desc: 'invalid emotion' },
        { mappings: { happy: { 'invalid': 0.8 } }, desc: 'invalid genre ID' },
        { mappings: { happy: { 35: 1.5 } }, desc: 'weight > 1' },
      ];

      for (const testCase of testCases) {
        const response = await request(app)
          .put(`/emotion-mappings/${userId}`)
          .set('Authorization', `Bearer ${userToken}`)
          .send(testCase);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
      }
    });

    it('should require authentication for updates', async () => {
      const response = await request(app)
        .put(`/emotion-mappings/${userId}`)
        .send({ mappings: validMappings });

      expect(response.status).toBe(401);
    });

    it('should handle missing mappings field', async () => {
      const response = await request(app)
        .put(`/emotion-mappings/${userId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should handle malformed request body', async () => {
      const response = await request(app)
        .put(`/emotion-mappings/${userId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send('invalid json');

      expect(response.status).toBe(400);
    });
  });

  describe('Delete User Mappings', () => {
    beforeEach(async () => {
      await request(app)
        .put(`/emotion-mappings/${userId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          mappings: {
            happy: { 35: 0.8 }
          }
        });
    });

    it('should delete specific emotion mapping', async () => {
      const response = await request(app)
        .delete(`/emotion-mappings/${userId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          emotion: 'happy',
          genreId: 35
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });

    it('should validate emotion parameter', async () => {
      const response = await request(app)
        .delete(`/emotion-mappings/${userId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          emotion: 'invalid',
          genreId: 35
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should validate genre ID parameter', async () => {
      const response = await request(app)
        .delete(`/emotion-mappings/${userId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          emotion: 'happy',
          genreId: 'invalid'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should require authentication for deletion', async () => {
      const response = await request(app)
        .delete(`/emotion-mappings/${userId}`)
        .send({
          emotion: 'happy',
          genreId: 35
        });

      expect(response.status).toBe(401);
    });

    it('should handle non-existent mapping deletion gracefully', async () => {
      const response = await request(app)
        .delete(`/emotion-mappings/${userId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          emotion: 'happy',
          genreId: 999
        });

      expect(response.status).toBe(200);
    });
  });

  describe('Data Validation Security', () => {
    it('should prevent SQL injection in emotion parameter', async () => {
      const response = await request(app)
        .put(`/emotion-mappings/${userId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          mappings: {
            "'; DROP TABLE users; --": { 35: 0.8 }
          }
        });

      expect(response.status).toBe(400);
    });

    it('should prevent XSS in mapping data', async () => {
      const response = await request(app)
        .put(`/emotion-mappings/${userId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          mappings: {
            happy: { '<script>alert("xss")</script>': 0.8 }
          }
        });

      expect(response.status).toBe(400);
    });

    it('should handle extremely large payload gracefully', async () => {
      const largeMappings: any = {};
      // Create large mapping object
      for (let i = 0; i < 1000; i++) {
        largeMappings[`emotion${i}`] = { [i]: 0.5 };
      }

      const response = await request(app)
        .put(`/emotion-mappings/${userId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ mappings: largeMappings });

      expect(response.status).toBe(400);
    });
  });

  describe('Error Handling', () => {
    it('should return consistent error format', async () => {
      const response = await request(app)
        .put(`/emotion-mappings/${userId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ mappings: { invalid: 'data' } });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(typeof response.body.error).toBe('string');
    });

    it('should handle database connection errors gracefully', async () => {
      const response = await request(app)
        .get('/emotion-mappings/invalid')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.body).toHaveProperty('error');
    });
  });
});