import 'dotenv/config';
import app from './app';
import { connectDB } from './config/database';

if (!process.env.JWT_SECRET) {
  console.error('ERROR: JWT_SECRET environment variable is required');
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is required');
  process.exit(1);
}

const PORT = process.env.PORT || 3001;

const startServer = async () => {
  try {
    console.log('Starting EmotionFlix server...');
    try {
      await connectDB();
    } catch {
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

void startServer();
