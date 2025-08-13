// src/routes/auth.ts - Authentication routes for user registration, login, and profile retrieval

import express from 'express';
import { register, login, getProfile, changePassword } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile', authenticateToken, getProfile);
router.put('/change-password', authenticateToken, changePassword);

export default router;