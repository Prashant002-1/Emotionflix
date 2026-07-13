import React from 'react';
import { Pencil, Plus } from 'lucide-react';
import { EmotionScores } from '../../../types/emotion';
import { emotionColors, emotionLabels } from '../../../utils/display';

interface EmotionDisplayProps {
  emotions: EmotionScores;
  showLogButton?: boolean;
  onLogEmotion?: () => void;
}

const EmotionDisplay: React.FC<EmotionDisplayProps> = ({ emotions, showLogButton = false, onLogEmotion }) => {
  const significant = (Object.entries(emotions) as [keyof EmotionScores, number][])
    .filter(([, value]) => value > 0.03)
    .sort(([, first], [, second]) => second - first)
    .slice(0, 5);

  if (!significant.length) {
    return showLogButton ? (
      <button className="button button--secondary" onClick={onLogEmotion} type="button"><Plus size={15} />Add feeling</button>
    ) : null;
  }

  return (
    <div>
      <div className="emotion-bars">
        {significant.map(([emotion, value]) => (
          <div className="emotion-bar" key={emotion} style={{ '--emotion-color': emotionColors[emotion] } as React.CSSProperties}>
            <span className="emotion-bar__label">{emotionLabels[emotion]}</span>
            <span className="emotion-bar__track" aria-hidden="true"><span className="emotion-bar__fill" style={{ display: 'block', width: `${Math.round(value * 100)}%` }} /></span>
            <span className="emotion-bar__value">{Math.round(value * 100)}%</span>
          </div>
        ))}
      </div>
      {showLogButton && onLogEmotion && <button className="button button--ghost emotion-update" onClick={onLogEmotion} type="button"><Pencil size={15} />Update feeling</button>}
    </div>
  );
};

export default EmotionDisplay;
