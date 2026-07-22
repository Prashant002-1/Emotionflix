import path from 'path';
import dotenv from 'dotenv';

export const projectRoot = process.env.VERCEL
  ? process.cwd()
  : path.resolve(__dirname, '../../..');

// One root env file is the supported setup. Loading the old server file second
// keeps existing local keys working while people move them at their own pace.
dotenv.config({ path: path.join(projectRoot, '.env'), quiet: true });
dotenv.config({ path: path.join(projectRoot, 'server/.env'), quiet: true });

process.env.JWT_SECRET ||= 'emotionflix-local-development-secret';
process.env.JWT_EXPIRES_IN ||= '7d';

const configuredDatabasePath = process.env.DATABASE_PATH
  || (process.env.VERCEL ? 'memory://' : '.data/emotionflix');
const configuredSnapshotPath = process.env.DATABASE_SNAPSHOT_PATH
  || (process.env.VERCEL ? 'database/demo-seed.tgz' : '');

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3001),
  databasePath: configuredDatabasePath === 'memory://'
    ? configuredDatabasePath
    : path.resolve(projectRoot, configuredDatabasePath),
  databaseSnapshotPath: configuredSnapshotPath
    ? path.resolve(projectRoot, configuredSnapshotPath)
    : undefined,
  tmdbApiKey: process.env.TMDB_API_KEY || '',
};
