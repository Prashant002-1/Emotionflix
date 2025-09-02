/**
 * Emotion Mapping Controller
 * 
 * Manages user-specific emotion-to-genre mappings for personalized recommendations.
 * Handles CRUD operations for emotion mappings, batch updates from user interactions,
 * and authorization checks to ensure users can only access their own data.
 */

import { Response } from 'express';
import { UserEmotionMappingModel, PersonalizedMapping } from '../models/UserEmotionMapping';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';

const VALID_EMOTIONS = ['neutral', 'happy', 'sad', 'angry', 'fearful', 'disgusted', 'surprised'];

const updateMappingsSchema = z.object({
  mappings: z.record(
    z.string().refine((emotion) => VALID_EMOTIONS.includes(emotion), {
      message: 'Invalid emotion. Must be one of: neutral, happy, sad, angry, fearful, disgusted, surprised'
    }),
    z.record(
      z.string().regex(/^\d+$/, 'Genre ID must be a positive integer').transform(Number),
      z.number().min(0, 'Weight must be >= 0').max(1, 'Weight must be <= 1')
    )
  )
});

/**
 * Checks if authenticated user has authorization to access another user's resources.
 * @param authenticatedUserId - ID of the authenticated user
 * @param resourceUserId - ID of the user whose resource is being accessed
 * @returns True if authorized, false otherwise
 */
const checkUserAuthorization = (authenticatedUserId: number, resourceUserId: number): boolean => {
  return authenticatedUserId === resourceUserId;
};

/**
 * Retrieves emotion-to-genre mappings for a specific user.
 * Enforces authorization to ensure users can only access their own mappings.
 * 
 * @param req - Authenticated request with user ID parameter
 * @param res - Express response object
 */
export const getUserEmotionMappings = async (req: AuthRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    if (!req.user || !checkUserAuthorization(req.user.id, userId)) {
      return res.status(403).json({ error: 'Access denied. You can only access your own emotion mappings.' });
    }

    const mappings = await UserEmotionMappingModel.getUserMappings(userId);
    
    res.json({
      userId,
      mappings
    });
  } catch (error) {
    console.error('Error fetching user emotion mappings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateUserEmotionMappings = async (req: AuthRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    if (!req.user || !checkUserAuthorization(req.user.id, userId)) {
      return res.status(403).json({ error: 'Access denied. You can only modify your own emotion mappings.' });
    }

    const validatedData = updateMappingsSchema.parse(req.body);
    const { mappings } = validatedData;

    // Mappings are already validated by Zod schema
    const processedMappings: PersonalizedMapping = mappings;

    await UserEmotionMappingModel.upsertUserMappings(userId, processedMappings);
    
    res.json({
      message: 'User emotion mappings updated successfully',
      userId,
      mappings: processedMappings
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    
    console.error('Error updating user emotion mappings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Delete an individual emotion mapping for a user.
 * Allows a user to remove a specific genre mapping for a given emotion.
 * @param req Authenticated request containing userId, emotion, and genreId
 * @param res Response object
 */
export const deleteUserEmotionMapping = async (req: AuthRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const { emotion, genreId } = req.body;
    
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    if (!req.user || !checkUserAuthorization(req.user.id, userId)) {
      return res.status(403).json({ error: 'Access denied. You can only delete your own emotion mappings.' });
    }

    if (!emotion || !genreId) {
      return res.status(400).json({ error: 'Emotion and genre ID are required' });
    }

    if (!VALID_EMOTIONS.includes(emotion)) {
      return res.status(400).json({ error: 'Invalid emotion' });
    }

    const genreIdNum = parseInt(genreId);
    if (isNaN(genreIdNum) || genreIdNum <= 0) {
      return res.status(400).json({ error: 'Invalid genre ID' });
    }

    await UserEmotionMappingModel.deleteUserMapping(userId, emotion, genreIdNum);
    
    res.json({
      success: true,
      message: 'User emotion mapping deleted successfully',
      userId,
      emotion,
      genreId: genreIdNum
    });
  } catch (error) {
    console.error('Error deleting user emotion mapping:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteUserEmotionMappings = async (req: AuthRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    if (!req.user || !checkUserAuthorization(req.user.id, userId)) {
      return res.status(403).json({ error: 'Access denied. You can only delete your own emotion mappings.' });
    }

    await UserEmotionMappingModel.deleteUserMappings(userId);
    
    res.json({
      message: 'User emotion mappings deleted successfully',
      userId
    });
  } catch (error) {
    console.error('Error deleting user emotion mappings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Legacy aliases for backwards compatibility with existing API clients.
 * These provide shorter method names for common operations.
 */
export const getUserMappings = getUserEmotionMappings;
export const updateUserMappings = updateUserEmotionMappings;

/**
 * Controller object export containing all emotion mapping operations.
 * This provides a centralized interface for all emotion mapping functionality
 * including CRUD operations with proper authentication and authorization.
 */
export const emotionMappingController = {
  getUserMappings: getUserEmotionMappings,
  updateUserMappings: updateUserEmotionMappings,
  deleteUserMapping: deleteUserEmotionMapping,
  deleteUserMappings: deleteUserEmotionMappings,
};