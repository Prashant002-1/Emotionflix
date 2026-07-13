import React from 'react';
import { EmotionScores } from '../../types/emotion';
import { emotionLabels } from '../../utils/display';

interface EmotionDisplayInlineProps {
  emotions: EmotionScores;
  threshold?: number;
  className?: string;
}

export const EmotionDisplayInline: React.FC<EmotionDisplayInlineProps> = ({ emotions, threshold = 0.01, className = '' }) => {
  const values = (Object.entries(emotions) as [keyof EmotionScores, number][])
    .filter(([, value]) => value > threshold)
    .sort(([, first], [, second]) => second - first);

  if (!values.length) return <span className={`metadata ${className}`}>No feeling saved</span>;

  return (
    <span className={`metadata ${className}`}>
      {values.map(([emotion, value]) => `${emotionLabels[emotion]} ${Math.round(value * 100)}%`).join(' · ')}
    </span>
  );
};
