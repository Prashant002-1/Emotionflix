/**
 * EmotionDisplay Component
 * 
 * Displays emotion scores with icons and percentages in a styled format.
 * Optionally includes a button to log emotions for a movie.
 */

import React from 'react';
import { EmotionScores } from '../../../types/emotion';
import { useTheme } from '../../../contexts/ThemeContext';

interface EmotionDisplayProps {
  emotions: EmotionScores;
  showLogButton?: boolean;
  onLogEmotion?: () => void;
}

const EMOTION_ICONS = {
  neutral: 'fas fa-meh',
  happy: 'fas fa-smile',
  sad: 'fas fa-frown',
  angry: 'fas fa-angry',
  fearful: 'fas fa-grimace',
  disgusted: 'fas fa-dizzy',
  surprised: 'fas fa-surprise',
} as const;

const EMOTION_COLORS = {
  neutral: 'text-gray-500',
  happy: 'text-yellow-500',
  sad: 'text-blue-500',
  angry: 'text-red-500',
  fearful: 'text-purple-500',
  disgusted: 'text-green-500',
  surprised: 'text-orange-500',
} as const;

const EMOTION_BG_COLORS = {
  neutral: 'bg-gradient-to-r from-gray-100/80 to-gray-200/80 dark:from-gray-800/60 dark:to-slate-800/60',
  happy: 'bg-gradient-to-r from-yellow-100/80 to-amber-100/80 dark:from-yellow-900/40 dark:to-amber-900/40',
  sad: 'bg-gradient-to-r from-blue-100/80 to-sky-100/80 dark:from-blue-900/40 dark:to-sky-900/40',
  angry: 'bg-gradient-to-r from-red-100/80 to-rose-100/80 dark:from-red-900/40 dark:to-rose-900/40',
  fearful: 'bg-gradient-to-r from-purple-100/80 to-violet-100/80 dark:from-purple-900/40 dark:to-violet-900/40',
  disgusted: 'bg-gradient-to-r from-green-100/80 to-emerald-100/80 dark:from-green-900/40 dark:to-emerald-900/40',
  surprised: 'bg-gradient-to-r from-orange-100/80 to-amber-100/80 dark:from-orange-900/40 dark:to-amber-900/40',
} as const;

/**
 * EmotionDisplay component that renders emotion scores with icons and optional log button.
 * @param emotions - Emotion scores object to display
 * @param showLogButton - Whether to show the "Log Emotion" button
 * @param onLogEmotion - Callback function for logging emotions
 */
const EmotionDisplay: React.FC<EmotionDisplayProps> = ({ 
  emotions, 
  showLogButton = false, 
  onLogEmotion 
}) => {
  const { theme } = useTheme();

  // Filter emotions that are > 3% and sort by value - show more emotions
  const significantEmotions = Object.entries(emotions)
    .filter(([_, value]) => value > 0.03)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5); // Show top 5 emotions

  if (significantEmotions.length === 0 && showLogButton) {
    return (
      <div className="mt-2">
        <button
          onClick={onLogEmotion}
          className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border transition-all backdrop-blur-sm ${
            theme === 'dark'
              ? 'text-gray-300 border-gray-600/50 bg-gradient-to-r from-slate-800/40 to-gray-800/40 hover:from-slate-700/60 hover:to-gray-700/60'
              : 'text-gray-600 border-gray-300/60 bg-gradient-to-r from-white/60 to-gray-50/60 hover:from-gray-50/80 hover:to-gray-100/80'
          }`}
        >
          <i className="fas fa-plus"></i>
          Log Emotion
        </button>
      </div>
    );
  }

  return (
    <div className="mt-2">
      <div className="flex flex-wrap gap-2">
        {significantEmotions.map(([emotion, value]) => (
          <div
            key={emotion}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold backdrop-blur-sm border border-white/20 dark:border-gray-600/20 shadow-sm ${
              EMOTION_COLORS[emotion as keyof typeof EMOTION_COLORS]
            } ${EMOTION_BG_COLORS[emotion as keyof typeof EMOTION_BG_COLORS]}`}
          >
            <i className={EMOTION_ICONS[emotion as keyof typeof EMOTION_ICONS]}></i>
            <span className="capitalize">{emotion}</span>
            <span className="font-bold">
              {Math.round(value * 100)}%
            </span>
          </div>
        ))}
      </div>
      
      {showLogButton && onLogEmotion && (
        <button
          onClick={onLogEmotion}
          className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border transition-all mt-2 backdrop-blur-sm ${
            theme === 'dark'
              ? 'text-gray-300 border-gray-600/50 bg-gradient-to-r from-slate-800/40 to-gray-800/40 hover:from-slate-700/60 hover:to-gray-700/60'
              : 'text-gray-600 border-gray-300/60 bg-gradient-to-r from-white/60 to-gray-50/60 hover:from-gray-50/80 hover:to-gray-100/80'
          }`}
        >
          <i className="fas fa-edit"></i>
          Update Emotions
        </button>
      )}
    </div>
  );
};

export default EmotionDisplay;