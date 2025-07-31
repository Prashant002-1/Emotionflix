/**
 * EMOTION SLIDER COMPONENT
 *   Individual slider for scoring emotional intensity
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
 * NAME
 *   EmotionSlider - Individual emotion intensity slider component
 *
 * DESCRIPTION
 *   Renders a slider input for users to manually score the intensity
 *   of a specific emotion from 0 to 1. Used as fallback when image
 *   analysis fails or for manual preference input.
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