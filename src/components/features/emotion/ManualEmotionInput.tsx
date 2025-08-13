/**
 * MANUAL EMOTION INPUT COMPONENT
 *   Interface for users to manually score their emotional state
 */

import React, { useState } from 'react';
import { EmotionScores } from '../../../types/emotion';
import EmotionSlider from './EmotionSlider';

interface ManualEmotionInputProps {
  onEmotionScores?: (scores: EmotionScores) => void;
  onEmotionChange?: (scores: EmotionScores) => void;
  onSubmit?: (scores: EmotionScores) => void;
  showSubmitButton?: boolean;
}

/**
 * NAME
 *   ManualEmotionInput - Manual emotion scoring interface
 *
 * DESCRIPTION
 *   Provides sliders for users to manually input their emotional intensities
 *   across the seven emotion categories supported by face-api.js.
 *   Used as fallback when image analysis is unsuccessful.
 */
const ManualEmotionInput: React.FC<ManualEmotionInputProps> = ({ 
  onEmotionScores, 
  onEmotionChange, 
  onSubmit, 
  showSubmitButton = false 
}) => {
  const [emotions, setEmotions] = useState<EmotionScores>({
    neutral: 0,
    happy: 0,
    sad: 0,
    angry: 0,
    fearful: 0,
    disgusted: 0,
    surprised: 0,
  });

  const updateEmotion = (emotion: keyof EmotionScores, value: number) => {
    const updatedEmotions = { ...emotions, [emotion]: value };
    setEmotions(updatedEmotions);
    onEmotionScores?.(updatedEmotions);
    onEmotionChange?.(updatedEmotions);
  };

  const handleSubmit = () => {
    onSubmit?.(emotions);
  };

  const emotionColors = {
    neutral: '#9CA3AF',
    happy: '#FCD34D',
    sad: '#60A5FA',
    angry: '#F87171',
    fearful: '#A78BFA',
    disgusted: '#34D399',
    surprised: '#FBBF24',
  };

  return (
    <div className="bg-black/40 backdrop-blur-md p-8 rounded-2xl border border-purple-500/30">
      <h3 className="text-xl font-semibold mb-4 text-white">
        How are you feeling?
      </h3>
      <p className="text-gray-300 mb-8 leading-relaxed">
        Adjust the sliders to reflect your current emotional state:
      </p>
      
      {Object.entries(emotions).map(([emotion, value]) => (
        <EmotionSlider
          key={emotion}
          label={emotion}
          value={value}
          onChange={(newValue) => updateEmotion(emotion as keyof EmotionScores, newValue)}
          color={emotionColors[emotion as keyof EmotionScores]}
        />
      ))}
      
      <div className="mt-8 p-4 bg-black/20 backdrop-blur-sm rounded-xl border border-purple-500/20">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-300">Total Intensity</span>
          <span className="text-sm font-bold text-purple-300">
            {(Object.values(emotions).reduce((a, b) => a + b, 0) * 100).toFixed(0)}%
          </span>
        </div>
      </div>
      
      {showSubmitButton && (
        <div className="mt-6 text-center">
          <button
            onClick={handleSubmit}
            className="px-8 py-3 bg-gradient-to-r from-cinema-500 to-film-500 text-white font-semibold rounded-xl transition-all duration-200 hover:shadow-cinema"
          >
            Submit Emotions
          </button>
        </div>
      )}
    </div>
  );
};

export default ManualEmotionInput;