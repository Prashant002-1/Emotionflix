import React, { useState } from 'react';
import { EmotionScores } from '../../../types/emotion';
import { emotionColors, emotionLabels } from '../../../utils/display';
import EmotionSlider from './EmotionSlider';

interface ManualEmotionInputProps {
  onEmotionScores?: (scores: EmotionScores) => void;
  onEmotionChange?: (scores: EmotionScores) => void;
  onSubmit?: (scores: EmotionScores) => void;
  showSubmitButton?: boolean;
  initialScores?: EmotionScores;
  heading?: string;
  description?: string;
  submitLabel?: string;
}

const EMPTY_SCORES: EmotionScores = {
  neutral: 0,
  happy: 0,
  sad: 0,
  angry: 0,
  fearful: 0,
  disgusted: 0,
  surprised: 0,
};

const ManualEmotionInput: React.FC<ManualEmotionInputProps> = ({
  onEmotionScores,
  onEmotionChange,
  onSubmit,
  showSubmitButton = false,
  initialScores,
  heading = 'What did you feel?',
  description = 'Raise the feelings that belong to this viewing. They do not need to add up to 100%.',
  submitLabel = 'Use these feelings',
}) => {
  const [emotions, setEmotions] = useState<EmotionScores>(initialScores || EMPTY_SCORES);

  const updateEmotion = (emotion: keyof EmotionScores, value: number) => {
    const next = { ...emotions, [emotion]: value };
    setEmotions(next);
    onEmotionScores?.(next);
    onEmotionChange?.(next);
  };

  return (
    <div className="capture-shell">
      <div className="capture-copy">
        <h3>{heading}</h3>
        <p>{description}</p>
      </div>
      <div className="slider-list">
        {(Object.entries(emotions) as [keyof EmotionScores, number][]).map(([emotion, value]) => (
          <EmotionSlider color={emotionColors[emotion]} key={emotion} label={emotionLabels[emotion]} onChange={(next) => updateEmotion(emotion, next)} value={value} />
        ))}
      </div>
      {showSubmitButton && (
        <button className="button button--primary" disabled={Object.values(emotions).every(value => value === 0)} onClick={() => onSubmit?.(emotions)} type="button">{submitLabel}</button>
      )}
    </div>
  );
};

export default ManualEmotionInput;
