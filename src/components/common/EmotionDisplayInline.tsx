/**
 * INLINE EMOTION DISPLAY COMPONENT
 *   Inline component for displaying emotions with icons
 */

import React from 'react';
import { EmotionScores } from '../../types/emotion';
import { useEmotion } from '../../contexts/EmotionContext';

interface EmotionDisplayInlineProps {
  emotions: EmotionScores;
  threshold?: number;
  className?: string;
}

export const EmotionDisplayInline: React.FC<EmotionDisplayInlineProps> = ({ 
  emotions, 
  threshold = 0.01,
  className = ''
}) => {
  const { getEmotionDisplayString } = useEmotion();
  const emotionData = getEmotionDisplayString(emotions, threshold);

  if (emotionData.length === 0) {
    return (
      <span className={`inline-flex items-center gap-1 ${className}`}>
        <i className="fas fa-meh text-gray-500"></i>
        <span className="text-gray-500">No significant emotions</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-2 flex-wrap ${className}`}>
      {emotionData.map(({ emotion, value, icon, color }, index) => (
        <span key={emotion} className="inline-flex items-center gap-1">
          <i className={`${icon} ${color}`}></i>
          <span className="font-medium">{Math.round(value * 100)}%</span>
          {index < emotionData.length - 1 && <span className="text-gray-400">•</span>}
        </span>
      ))}
    </span>
  );
};