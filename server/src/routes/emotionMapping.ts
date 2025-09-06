/**
 * Emotion Mapping Routes
 * 
 * Express router for managing user-specific emotion-to-genre mappings.
 * All routes require authentication and implement authorization checks
 * to ensure users can only access their own emotion mapping data.
 */

import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { 
  getUserEmotionMappings, 
  updateUserEmotionMappings,
  deleteUserEmotionMappings
} from '../controllers/emotionMappingController';

const router = express.Router();

/** Apply authentication middleware to all routes */
router.use(authenticateToken);

/** GET /emotion-mappings/:userId - Retrieve user's personalized emotion-to-genre mappings */
router.get('/:userId', getUserEmotionMappings);

/** PUT /emotion-mappings/:userId - Update user's emotion-to-genre mappings */
router.put('/:userId', updateUserEmotionMappings);

/** DELETE /emotion-mappings/:userId - Delete user's emotion-to-genre mappings */
router.delete('/:userId', deleteUserEmotionMappings);

export default router;