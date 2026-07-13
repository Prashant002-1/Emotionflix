import { EmotionScores } from '../types/emotion';

export const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

export const imageUrl = (path: string | null | undefined, size = 'w500') =>
  path ? `${TMDB_IMAGE_BASE}/${size}${path}` : null;

export const releaseYear = (date?: string) => {
  if (!date) return 'Date unknown';
  const year = new Date(date).getFullYear();
  return Number.isNaN(year) ? 'Date unknown' : String(year);
};

export const formatRuntime = (minutes?: number) => {
  if (!minutes) return null;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours ? `${hours}h ${rest}m` : `${rest}m`;
};

export const emotionLabels: Record<keyof EmotionScores, string> = {
  neutral: 'Stillness',
  happy: 'Joy',
  sad: 'Melancholy',
  angry: 'Friction',
  fearful: 'Tension',
  disgusted: 'Unease',
  surprised: 'Wonder',
};

export const emotionColors: Record<keyof EmotionScores, string> = {
  neutral: '#82908F',
  happy: '#D76358',
  sad: '#557890',
  angry: '#A9433F',
  fearful: '#713B42',
  disgusted: '#477B78',
  surprised: '#78A6A0',
};

const emotionKeys = Object.keys(emotionLabels) as (keyof EmotionScores)[];

export const dominantEmotion = (scores?: EmotionScores | null) => {
  if (!scores) return null;
  const [emotion, score] = emotionKeys
    .map(key => [key, Number(scores[key]) || 0] as const)
    .sort(([, first], [, second]) => second - first)[0] || [];
  return emotion ? { emotion, label: emotionLabels[emotion], score } : null;
};
