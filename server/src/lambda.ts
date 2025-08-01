import serverless from 'serverless-http';
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/database';
import authRoutes from './routes/auth';

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'EmotionFlix API is running on Lambda',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/auth', authRoutes);

// Initialize database connection once
connectDB().catch(console.error);

export const handler = serverless(app);