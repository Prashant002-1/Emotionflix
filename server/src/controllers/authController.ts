/**
 * Authentication Controller
 * 
 * Handles user authentication operations including registration, login,
 * password management, and profile retrieval. Implements JWT-based
 * authentication with password strength validation and secure hashing.
 */

import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { UserModel } from '../models/User';

/**
 * Validates password strength according to security requirements.
 * Checks for minimum length, character diversity, and common weak passwords.
 * 
 * @param password - Password string to validate
 * @returns Object with validation result and error message if invalid
 */
const validatePasswordStrength = (password: string): { isValid: boolean; error?: string } => {
  if (password.length < 6) {
    return { isValid: false, error: 'Password must be at least 6 characters long' };
  }
  
  // Check for common weak patterns
  if (/^[0-9]+$/.test(password)) {
    return { isValid: false, error: 'Password cannot be only numbers' };
  }
  
  if (/^[a-zA-Z]+$/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one number or special character' };
  }
  
  // Check for very common weak passwords (exact matches only)
  const commonWeakPasswords = [
    'password', '123456', '123456789', 'qwerty', 'abc123', 'password123',
    'admin', 'letmein', 'welcome', 'monkey', 'dragon', 'master'
  ];
  
  if (commonWeakPasswords.includes(password.toLowerCase())) {
    return { isValid: false, error: 'Password is too common, please choose a stronger password' };
  }
  
  // Require at least one letter, one number, and one special character
  if (!/[a-zA-Z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one letter' };
  }
  
  if (!/[0-9]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one number' };
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one special character' };
  }
  
  return { isValid: true };
};

// Custom password validation for Zod
const passwordSchema = z.string()
  .min(6, 'Password must be at least 6 characters')
  .refine((password) => {
    const validation = validatePasswordStrength(password);
    return validation.isValid;
  }, (password) => {
    const validation = validatePasswordStrength(password);
    return { message: validation.error || 'Password does not meet strength requirements' };
  });

const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: passwordSchema,
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
});
const profileSchema = z.object({ bio: z.string().trim().max(240) });

export const register = async (req: Request, res: Response) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    const { email, username, password } = validatedData;

    const existingUserByEmail = await UserModel.findByEmail(email);
    if (existingUserByEmail) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const existingUserByUsername = await UserModel.findByUsername(username);
    if (existingUserByUsername) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    const user = await UserModel.create({ email, username, password });

    const token = jwt.sign(
      { id: user.id, email: user.email, username: user.username },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
    );

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        bio: user.bio || '',
      },
      token,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const { email, password } = validatedData;

    const user = await UserModel.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await UserModel.validatePassword(user, password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, username: user.username },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
    );

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        bio: user.bio || '',
      },
      token,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        bio: user.bio || '',
        created_at: user.created_at,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: 'Authentication required' });
    const { bio } = profileSchema.parse(req.body);
    const user = await UserModel.updateBio(userId, bio);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user: { id: user.id, email: user.email, username: user.username, bio: user.bio || '' } });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Invalid profile', details: error.errors });
    res.status(500).json({ error: 'Profile could not be updated' });
  }
};

/**
 * Change user password endpoint.
 * Validates current password and updates to new password if authentication succeeds.
 * @param req Request containing current password and new password
 * @param res Response object
 */
export const changePassword = async (req: Request, res: Response) => {
  try {
    const validatedData = changePasswordSchema.parse(req.body);
    const { currentPassword, newPassword } = validatedData;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await UserModel.findByEmail((req as any).user.email);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isValidCurrentPassword = await UserModel.validatePassword(user, currentPassword);
    if (!isValidCurrentPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const updateSuccess = await UserModel.updatePassword(userId, newPassword);
    if (!updateSuccess) {
      return res.status(500).json({ error: 'Failed to update password' });
    }

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Token verification endpoint for validating JWT tokens.
 * Used by clients to verify token validity and retrieve user information.
 * @param req Request containing Authorization header with Bearer token
 * @param res Response object
 */
export const verifyToken = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    const user = await UserModel.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        bio: user.bio || '',
      },
    });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'Token expired' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Authentication controller object export.
 * Provides a centralized interface for all authentication operations
 * including registration, login, profile management, password changes, and token verification.
 */
export const authController = {
  register,
  login,
  getProfile,
  changePassword,
  updateProfile,
  verifyToken,
};
