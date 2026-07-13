import request from 'supertest';
import app from '../src/app';

describe('Current HTTP contract', () => {
  it('exposes the diary API health boundary', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('EmotionFlix diary API is running');
  });

  it('does not expose the removed user-movie API', async () => {
    const response = await request(app).get('/api/user-movies');
    expect(response.status).toBe(404);
  });

  it('does not expose the removed emotion-mapping API', async () => {
    const response = await request(app).get('/api/emotion-mappings/1');
    expect(response.status).toBe(404);
  });

  it('protects the diary route', async () => {
    const response = await request(app).get('/api/diary');
    expect(response.status).toBe(401);
  });

  it('validates recommendation signals at the route boundary', async () => {
    const response = await request(app).post('/api/recommendations').send({ signal: { happy: 2 } });
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid feeling signal');
  });

  it('validates public feed limits before querying the database', async () => {
    const response = await request(app).get('/api/discovery/feed?limit=0');
    expect(response.status).toBe(400);
  });
});
