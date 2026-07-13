import cors from 'cors';
import express from 'express';
import authRoutes from './routes/auth';
import catalogRoutes from './routes/catalog';
import diaryRoutes from './routes/diary';
import discoveryRoutes from './routes/discovery';
import libraryRoutes from './routes/library';
import recommendationRoutes from './routes/recommendations';

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'OK',
    message: 'EmotionFlix diary API is running',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/catalog', catalogRoutes);
app.use('/api/diary', diaryRoutes);
app.use('/api/discovery', discoveryRoutes);
app.use('/api/library', libraryRoutes);
app.use('/api/recommendations', recommendationRoutes);

export default app;
