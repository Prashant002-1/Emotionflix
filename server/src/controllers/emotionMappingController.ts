// src/controllers/emotionMappingController.ts - Controller for user emotion-to-genre mappings

import { Request, Response } from 'express';
import { UserEmotionMappingModel, PersonalizedMapping } from '../models/UserEmotionMapping';
import { z } from 'zod';

const updateMappingsSchema = z.object({
  mappings: z.record(z.string(), z.record(z.string(), z.number()))
});

export const getUserEmotionMappings = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
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

export const updateUserEmotionMappings = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const validatedData = updateMappingsSchema.parse(req.body);
    const { mappings } = validatedData;

    // Convert string keys to numbers for genre IDs
    const processedMappings: PersonalizedMapping = {};
    for (const [emotion, genreWeights] of Object.entries(mappings)) {
      processedMappings[emotion] = {};
      for (const [genreIdStr, weight] of Object.entries(genreWeights)) {
        const genreId = parseInt(genreIdStr);
        if (!isNaN(genreId)) {
          processedMappings[emotion][genreId] = weight;
        }
      }
    }

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

export const deleteUserEmotionMappings = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
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