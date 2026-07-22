import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../config/database';
import { loadDiaryEntries, loadDiarySummary, loadSavedFilms } from './diaryController';
import { loadCommunityPulse, loadFeed, loadPeople } from './discoveryController';
import { recommend } from '../services/recommendationEngine';

interface DemoUserRow {
  id: number;
  email: string;
  username: string;
  bio: string | null;
}

export const openDemo = async (_req: Request, res: Response) => {
  try {
    const result = await pool.query<DemoUserRow>(
      'SELECT id, email, username, bio FROM users WHERE email = $1',
      ['demo@demo.com'],
    );
    const user = result.rows[0];
    if (!user) return res.status(503).json({ error: 'Demo data is unavailable' });

    const [entries, savedFilms, summary, feed, recommendations, people, pulse] = await Promise.all([
      loadDiaryEntries(user.id),
      loadSavedFilms(user.id),
      loadDiarySummary(user.id),
      loadFeed(user.id, 50),
      recommend(user.id),
      loadPeople(user.id),
      loadCommunityPulse(),
    ]);
    const publicUser = {
      id: user.id,
      email: user.email,
      username: user.username,
      bio: user.bio || '',
    };
    const token = jwt.sign(publicUser, process.env.JWT_SECRET!, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    } as jwt.SignOptions);

    return res.json({
      message: 'Demo ready',
      token,
      user: publicUser,
      bootstrap: {
        diary: { entries, savedFilms, summary },
        home: { entries: feed, recommendations, people, pulse },
      },
    });
  } catch (error) {
    console.error('Demo bootstrap error:', error);
    return res.status(503).json({ error: 'Demo could not be opened' });
  }
};
