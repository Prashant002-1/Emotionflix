import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it } from '@jest/globals';
import pool from '../src/config/database';
import authRoutes from '../src/routes/auth';

describe('Prepared demo entry', () => {
  const app = express();
  app.use(express.json());
  app.use('/auth', authRoutes);

  beforeEach(async () => {
    await pool.query(
      `INSERT INTO users (email, username, password_hash, bio)
       VALUES ('demo@demo.com', 'demo', 'demo-only-no-password-login', 'A prepared demo person.')
       ON CONFLICT (email) DO UPDATE SET username = EXCLUDED.username, bio = EXCLUDED.bio`,
    );
  });

  it('returns one demo session with its initial product data', async () => {
    const response = await request(app).post('/auth/demo');

    expect(response.status).toBe(200);
    expect(response.body.token).toMatch(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/);
    expect(response.body.user.username).toBe('demo');
    expect(response.body.bootstrap.diary).toEqual(expect.objectContaining({
      entries: expect.any(Array),
      savedFilms: expect.any(Array),
      summary: expect.any(Object),
    }));
    expect(response.body.bootstrap.home).toEqual(expect.objectContaining({
      entries: expect.any(Array),
      recommendations: expect.any(Object),
      people: expect.any(Array),
      pulse: expect.any(Array),
    }));
  });

  it('does not expose password login or registration routes', async () => {
    const [login, register] = await Promise.all([
      request(app).post('/auth/login'),
      request(app).post('/auth/register'),
    ]);

    expect(login.status).toBe(404);
    expect(register.status).toBe(404);
  });
});
