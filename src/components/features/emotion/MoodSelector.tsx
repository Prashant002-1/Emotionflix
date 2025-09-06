/**
 * MoodSelector Component
 * 
 * Provides quick mood selection with predefined emotion presets.
 * Allows users to select common moods or switch to complex emotion input.
 */

import React, { useState } from 'react';
import { EmotionScores } from '../../../types/emotion';
import { useTheme } from '../../../contexts/ThemeContext';

interface MoodSelectorProps {
  onMoodSelect?: (emotions: EmotionScores) => void;
  onComplexSearch: () => void;
}

const MOOD_PRESETS = {
  happy: { happy: 0.8, neutral: 0.15, surprised: 0.05, sad: 0, angry: 0, fearful: 0, disgusted: 0 },
  sad: { sad: 0.7, neutral: 0.2, fearful: 0.1, happy: 0, angry: 0, disgusted: 0, surprised: 0 },
  angry: { angry: 0.75, disgusted: 0.15, neutral: 0.1, happy: 0, sad: 0, fearful: 0, surprised: 0 },
  fearful: { fearful: 0.6, surprised: 0.2, neutral: 0.2, happy: 0, sad: 0, angry: 0, disgusted: 0 },
  excited: { happy: 0.6, surprised: 0.3, neutral: 0.1, sad: 0, angry: 0, fearful: 0, disgusted: 0 },
  calm: { neutral: 0.8, happy: 0.2, sad: 0, angry: 0, fearful: 0, disgusted: 0, surprised: 0 },
  disgusted: { disgusted: 0.7, angry: 0.2, neutral: 0.1, happy: 0, sad: 0, fearful: 0, surprised: 0 },
  surprised: { surprised: 0.8, happy: 0.1, neutral: 0.1, sad: 0, angry: 0, fearful: 0, disgusted: 0 },
} as const;


/**
 * MoodSelector component for quick emotion preset selection.
 * @param onMoodSelect - Callback function when a mood preset is selected
 * @param onComplexSearch - Callback to switch to complex emotion input mode
 */
const MoodSelector: React.FC<MoodSelectorProps> = ({ onMoodSelect, onComplexSearch }) => {
  const { theme } = useTheme();
  const [selectedMood, setSelectedMood] = useState<string>('happy'); // Default to happy

  // Auto-select happy mood on component mount
  React.useEffect(() => {
    if (selectedMood === 'happy' && onMoodSelect) {
      onMoodSelect(MOOD_PRESETS.happy);
    }
  }, []);

  const handleMoodChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const mood = event.target.value;
    setSelectedMood(mood);
    
    if (mood && mood in MOOD_PRESETS && onMoodSelect) {
      onMoodSelect(MOOD_PRESETS[mood as keyof typeof MOOD_PRESETS]);
    }
  };

  return (
    <div className="px-4 mb-8">
      <div className={`max-w-2xl mx-auto p-8 rounded-2xl border backdrop-blur-sm shadow-lg ${
        theme === 'dark'
          ? 'bg-gradient-to-br from-slate-800/50 via-gray-800/40 to-slate-900/50 border-gray-600/40 shadow-black/20'
          : 'bg-gradient-to-br from-white/90 via-gray-50/80 to-white/90 border-gray-300/40 shadow-gray-900/10'
      }`}>
        <div className="text-center mb-6">
          <h2 className={`text-2xl font-bold mb-2 ${
            theme === 'dark' ? 'text-white' : 'text-gray-800'
          }`}>
            What's your mood?
          </h2>
          <p className={`text-sm ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Get personalized movie recommendations based on how you're feeling
          </p>
        </div>
        
        <div className="space-y-6">
          <div className="relative">
            <select
              value={selectedMood}
              onChange={handleMoodChange}
              className={`w-full px-6 py-4 rounded-xl border text-lg appearance-none backdrop-blur-sm transition-all duration-200 ${
                theme === 'dark'
                  ? 'bg-gradient-to-r from-slate-800/60 to-gray-800/60 border-gray-600/50 text-white focus:border-gray-500 focus:from-slate-700/70 focus:to-gray-700/70'
                  : 'bg-gradient-to-r from-white/80 to-gray-50/80 border-gray-300/60 text-gray-800 focus:border-gray-400 focus:from-white/90 focus:to-gray-50/90'
              } focus:outline-none focus:ring-2 focus:ring-gray-400/30 shadow-inner`}
            >
              <option value="">Select your current mood...</option>
              {Object.entries(MOOD_PRESETS).map(([mood]) => (
                <option key={mood} value={mood}>
                  {mood.charAt(0).toUpperCase() + mood.slice(1)}
                </option>
              ))}
            </select>
            <i className={`fas fa-chevron-down absolute right-6 top-1/2 transform -translate-y-1/2 pointer-events-none ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}></i>
          </div>

          <div className="flex items-center justify-center">
            <button
              onClick={onComplexSearch}
              className={`px-6 py-3 rounded-xl text-sm font-medium border backdrop-blur-sm transition-all duration-200 hover:scale-105 ${
                theme === 'dark'
                  ? 'text-gray-300 border-gray-600/50 bg-gradient-to-r from-slate-800/40 to-gray-800/40 hover:from-slate-700/60 hover:to-gray-700/60 hover:border-gray-500/60'
                  : 'text-gray-600 border-gray-300/60 bg-gradient-to-r from-white/60 to-gray-50/60 hover:from-gray-50/80 hover:to-gray-100/80 hover:border-gray-400/60'
              }`}
            >
              <i className="fas fa-sliders-h mr-2"></i>
              Advanced Emotion Search
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoodSelector;