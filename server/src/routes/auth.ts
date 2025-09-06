/**
 * Authentication Routes
 * 
 * Express router for user authentication endpoints including registration,
 * login, profile management, and password changes. Implements JWT-based
 * authentication with protected routes for authenticated operations.
 */

import express from 'express';
import { register, login, getProfile, changePassword } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

/** POST /auth/register - Register new user account */
router.post('/register', register);

/** POST /auth/login - Authenticate user and return JWT token */
router.post('/login', login);

/** GET /auth/profile - Get authenticated user's profile information */
router.get('/profile', authenticateToken, getProfile);

/** PUT /auth/change-password - Change authenticated user's password */
router.put('/change-password', authenticateToken, changePassword);

export default router;