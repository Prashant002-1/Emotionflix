import React from 'react';

interface EmotionSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  color?: string;
  disabled?: boolean;
}

const EmotionSlider: React.FC<EmotionSliderProps> = ({ label, value, onChange, color, disabled = false }) => {
  const inputId = `emotion-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  return (
  <div className="slider-row" style={{ '--emotion-color': color } as React.CSSProperties}>
    <label htmlFor={inputId}>{label}</label>
    <input
      aria-label={`${label} intensity`}
      disabled={disabled}
      id={inputId}
      max="1"
      min="0"
      onChange={(event) => onChange(Number(event.target.value))}
      step="0.01"
      type="range"
      value={value}
    />
    <output htmlFor={inputId}>{Math.round(value * 100)}%</output>
  </div>
  );
};

export default EmotionSlider;
