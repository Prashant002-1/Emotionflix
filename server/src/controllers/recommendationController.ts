import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { EMOTION_KEYS, recommend } from '../services/recommendationEngine';

const signalSchema = z.object(Object.fromEntries(EMOTION_KEYS.map(key => [key, z.number().min(0).max(1)])) as Record<typeof EMOTION_KEYS[number], z.ZodNumber>);
const requestSchema = z.object({ signal: signalSchema.optional() }).default({});

export const getRecommendations = async (req: AuthRequest, res: Response) => {
  try {
    const body = requestSchema.parse(req.body || {});
    res.json(await recommend(req.user?.id, body.signal));
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Invalid feeling signal', details: error.errors });
    console.error('Recommendation error:', error);
    res.status(502).json({ error: 'Recommendations could not be built' });
  }
};
