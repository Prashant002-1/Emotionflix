import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/database';
import authRoutes from './routes/auth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'EmotionFlix API is running',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/auth', authRoutes);

const startServer = async () => {
  try {
    
    try {
      await connectDB();
    } catch (dbError) {
      // Database connection failed, continuing server startup
    }
    
    app.listen(PORT, () => {
      // Server started successfully
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();