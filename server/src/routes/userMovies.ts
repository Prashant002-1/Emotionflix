// src/routes/userMovies.ts - Routes for user movie management

import express from 'express';
import { getUserMovies, addUserMovie, updateUserMovie, removeUserMovie, getUserStats, getUserEmotionalProfile } from '../controllers/userMoviesController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get user's movies (with optional status filter)
router.get('/', getUserMovies);

// Add movie to user's list
router.post('/', addUserMovie);

// Update movie in user's list
router.put('/:movieId', updateUserMovie);

// Remove movie from user's list
router.delete('/:movieId', removeUserMovie);

// Get user statistics
router.get('/stats', getUserStats);

// Get user's emotional profile
router.get('/emotional-profile', getUserEmotionalProfile);

export default router;
