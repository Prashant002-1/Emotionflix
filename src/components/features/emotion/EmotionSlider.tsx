/**
 * Emotion Slider Component
 * 
 * Individual slider component for scoring emotional intensity.
 * Provides a visual range input for users to manually set emotion
 * intensity values from 0 to 1 with customizable styling.
 */

import React from 'react';

interface EmotionSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  color?: string;
  disabled?: boolean;
}

/**
 * Individual emotion intensity slider component.
 * Renders a slider input for users to manually score the intensity
 * of a specific emotion from 0 to 1. Features visual feedback with
 * color-coded progress and percentage display. Used as fallback when
 * image analysis fails or for manual preference input.
 * 
 * @param props - Component props
 * @param props.label - The emotion name to display as the slider label
 * @param props.value - Current intensity value (0-1)
 * @param props.onChange - Callback fired when slider value changes
 * @param props.color - Optional color for the slider track and thumb
 * @param props.disabled - Whether the slider is disabled
 * @returns JSX element containing the emotion intensity slider
 */
const EmotionSlider: React.FC<EmotionSliderProps> = ({ 
  label, 
  value, 
  onChange, 
  color = 'blue',
  disabled = false
}) => {
  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-3">
        <label className="text-sm font-medium text-gray-200 capitalize">
          {label}
        </label>
        <span className="text-sm font-bold text-purple-300 bg-black/30 px-2 py-1 rounded">
          {(value * 100).toFixed(0)}%
        </span>
      </div>
      <div className="relative">
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className={`w-full h-3 bg-black/30 rounded-full appearance-none ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:scale-105 transition-transform'} slider-${color}`}
          style={{
            background: `linear-gradient(to right, ${color} 0%, ${color} ${value * 100}%, rgba(0,0,0,0.3) ${value * 100}%, rgba(0,0,0,0.3) 100%)`
          }}
          aria-label={`${label} emotion intensity`}
        />
        <div 
          className="absolute top-1/2 w-5 h-5 bg-white rounded-full shadow-lg transform -translate-y-1/2 pointer-events-none border-2"
          style={{
            left: `calc(${value * 100}% - 10px)`,
            borderColor: color
          }}
        />
      </div>
    </div>
  );
};

export default EmotionSlider;