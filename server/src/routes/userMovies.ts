/**
 * User Movies Routes
 * 
 * Express router for managing user movie interactions including watchlist,
 * watch history, ratings, and emotion data. Provides endpoints for CRUD
 * operations on user movies and retrieval of user statistics and profiles.
 */

import express from 'express';
import { getUserMovies, addUserMovie, updateUserMovie, removeUserMovie, getUserStats, getUserEmotionalProfile } from '../controllers/userMoviesController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

/** Apply authentication middleware to all routes */
router.use(authenticateToken);

/** GET /user-movies - Get user's movies with optional status filter (watchlist/watched) */
router.get('/', getUserMovies);

/** POST /user-movies - Add movie to user's watchlist or mark as watched */
router.post('/', addUserMovie);

/** PUT /user-movies/:movieId - Update movie status, rating, or emotion data */
router.put('/:movieId', updateUserMovie);

/** DELETE /user-movies/:movieId - Remove movie from user's list */
router.delete('/:movieId', removeUserMovie);

/** GET /user-movies/stats - Get user's movie and emotion statistics */
router.get('/stats', getUserStats);

/** GET /user-movies/emotional-profile - Get user's aggregated emotional profile */
router.get('/emotional-profile', getUserEmotionalProfile);

export default router;
