// src/routes/emotionMapping.ts - Routes for user emotion-to-genre mappings

import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { 
  getUserEmotionMappings, 
  updateUserEmotionMappings,
  deleteUserEmotionMappings
} from '../controllers/emotionMappingController';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/emotion-mappings/:userId - Get user's personalized emotion mappings
router.get('/:userId', getUserEmotionMappings);

// PUT /api/emotion-mappings/:userId - Update user's emotion mappings
router.put('/:userId', updateUserEmotionMappings);

// DELETE /api/emotion-mappings/:userId - Delete user's emotion mappings
router.delete('/:userId', deleteUserEmotionMappings);

export default router;