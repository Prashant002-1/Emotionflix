/**
 * Authentication Middleware
 * 
 * JWT-based authentication middleware for protecting API routes.
 * Validates Bearer tokens and attaches user information to requests.
 * Provides type-safe authentication interface for controllers.
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

/**
 * Extended Request interface that includes authenticated user information.
 * Used by protected routes to access user data after token validation.
 */
export interface AuthRequest extends Request {
  /** Authenticated user information extracted from JWT token */
  user?: {
    /** User's unique identifier */
    id: number;
    /** User's email address */
    email: string;
    /** User's username */
    username: string;
  };
}

/**
 * Middleware function that validates JWT tokens and authenticates requests.
 * Extracts Bearer token from Authorization header, verifies it, and attaches
 * user information to the request object for use by protected routes.
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Next middleware function in the chain
 */
export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET!, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    
    req.user = decoded as AuthRequest['user'];
    next();
  });
};

/**
 * Adds user context when a valid token is present without making authentication
 * a requirement. Public discovery and recommendation routes use this to become
 * personal for signed-in visitors while remaining useful before sign-in.
 */
export const optionalAuthentication = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return next();

  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Invalid authorization header' });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET!) as AuthRequest['user'];
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
