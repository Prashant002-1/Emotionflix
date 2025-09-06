/**
 * EmotionFlix Server Entry Point
 * 
 * Main server file that initializes the Express application for EmotionFlix,
 * configures middleware, establishes database connections, and sets up API routes.
 * Handles environment validation, CORS configuration, and graceful error handling.
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/database';
import authRoutes from './routes/auth';
import emotionMappingRoutes from './routes/emotionMapping';
import userMoviesRoutes from './routes/userMovies';

dotenv.config();

if (!process.env.JWT_SECRET) {
  console.error('ERROR: JWT_SECRET environment variable is required');
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is required');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Health check endpoint
 * 
 * Provides server status and uptime information for monitoring purposes.
 * 
 * @returns JSON object with server status and timestamp
 */
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'EmotionFlix API is running',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/emotion-mappings', emotionMappingRoutes);
app.use('/api/user-movies', userMoviesRoutes);

/**
 * Initializes and starts the EmotionFlix server
 * 
 * Attempts database connection, starts the Express server on the configured port,
 * and provides graceful error handling for startup failures.
 * 
 * @throws Process exits with code 1 if server startup fails
 */
const startServer = async () => {
  try {
    console.log('Starting EmotionFlix server...');
    
    try {
      await connectDB();
    } catch (dbError) {
      console.warn('Database connection failed, continuing server startup');
    }
    
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();