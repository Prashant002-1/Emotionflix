import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
import { recommendationService } from '../services/recommendationService';
import { SearchMovies } from '../services/tmdbApi';
import { userMoviesService } from '../services/userMoviesService';
import { Movie } from '../types/movie';
import { EmotionScores } from '../types/emotion';
import { LoadingSpinner } from '../components/common';

const MovieMatch: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useUser();
  
  // Movie search states
  const [movieSearchQuery, setMovieSearchQuery] = useState('');
  const [autocompleteResults, setAutocompleteResults] = useState<Movie[]>([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [selectedSearchMovie, setSelectedSearchMovie] = useState<Movie | null>(null);
  
  // Current emotion state for matching
  const [emotions, setEmotions] = useState<EmotionScores>({
    neutral: 20,
    happy: 30,
    sad: 10,
    angry: 10,
    fearful: 10,
    disgusted: 5,
    surprised: 15
  });

  // Load user's emotional profile on component mount
  useEffect(() => {
    const loadUserEmotionalProfile = async () => {
      if (user?.id) {
        try {
          const userEmotions = await userMoviesService.getUserEmotionalProfile();
          // Convert from decimal (0-1) to percentage (0-100)
          const emotionsAsPercentages: EmotionScores = {
            neutral: Math.round(userEmotions.neutral * 100),
            happy: Math.round(userEmotions.happy * 100),
            sad: Math.round(userEmotions.sad * 100),
            angry: Math.round(userEmotions.angry * 100),
            fearful: Math.round(userEmotions.fearful * 100),
            disgusted: Math.round(userEmotions.disgusted * 100),
            surprised: Math.round(userEmotions.surprised * 100)
          };
          setEmotions(emotionsAsPercentages);
        } catch (error) {
          console.error('Error loading user emotional profile:', error);
          // Keep default emotions if loading fails
        }
      }
    };

    loadUserEmotionalProfile();
  }, [user?.id]);

  // Calculate emotion compatibility score for a movie using personalized mappings
  const calculateEmotionScore = async (movie: Movie, emotions: EmotionScores): Promise<number> => {
    const emotionCompatibility = await recommendationService.calculateEmotionCompatibility(
      emotions, 
      movie.genre_ids, 
      user?.id?.toString() || '' // Get from user context
    );
    
    // Quality score from rating and popularity
    const qualityScore = (movie.vote_average / 10) * 0.2 + (Math.log10(movie.popularity) / 4) * 0.1;
    
    // Weighted combination favoring emotion match
    return emotionCompatibility * 0.8 + qualityScore * 0.2;
  };

  const handleAutocompleteSearch = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setAutocompleteResults([]);
      setShowAutocomplete(false);
      return;
    }

    try {
      const response = await SearchMovies(query);
      setAutocompleteResults(response.results.slice(0, 8));
      setShowAutocomplete(true);
    } catch (error) {
      setAutocompleteResults([]);
      setShowAutocomplete(false);
    }
  };

  const handleMovieSearchQueryChange = (value: string) => {
    setMovieSearchQuery(value);
    // Debounce autocomplete search
    clearTimeout((window as any).autocompleteTimeout);
    (window as any).autocompleteTimeout = setTimeout(() => {
      handleAutocompleteSearch(value);
    }, 300);
  };

  const handleAutocompleteSelect = (movie: Movie) => {
    setMovieSearchQuery(movie.title);
    setSelectedSearchMovie(movie);
    setShowAutocomplete(false);
    setAutocompleteResults([]);
  };

  const clearMovieSearch = () => {
    setMovieSearchQuery('');
    setSelectedSearchMovie(null);
    setAutocompleteResults([]);
    setShowAutocomplete(false);
  };

  const handleEmotionChange = (emotion: keyof EmotionScores, value: number) => {
    setEmotions(prev => ({
      ...prev,
      [emotion]: value
    }));
  };

  const resetEmotions = () => {
    setEmotions({
      neutral: 20,
      happy: 30,
      sad: 10,
      angry: 10,
      fearful: 10,
      disgusted: 5,
      surprised: 15
    });
  };

  const emotionInfo = {
    neutral: { icon: 'fas fa-meh', color: 'text-gray-500', label: 'Neutral' },
    happy: { icon: 'fas fa-smile', color: 'text-yellow-500', label: 'Happy' },
    sad: { icon: 'fas fa-frown', color: 'text-blue-500', label: 'Sad' },
    angry: { icon: 'fas fa-angry', color: 'text-red-500', label: 'Angry' },
    fearful: { icon: 'fas fa-grimace', color: 'text-purple-500', label: 'Fearful' },
    disgusted: { icon: 'fas fa-dizzy', color: 'text-green-500', label: 'Disgusted' },
    surprised: { icon: 'fas fa-surprise', color: 'text-orange-500', label: 'Surprised' }
  };

  // Search Movie Display Component
  const SearchMovieDisplay: React.FC<{
    movie: Movie;
    emotions: EmotionScores;
    theme: string;
    onClear: () => void;
    calculateEmotionScore: (movie: Movie, emotions: EmotionScores) => Promise<number>;
  }> = ({ movie, emotions, theme, onClear, calculateEmotionScore }) => {
    const [emotionScore, setEmotionScore] = useState<number | null>(null);

    useEffect(() => {
      const getScore = async () => {
        const normalizedEmotions = {
          neutral: emotions.neutral / 100,
          happy: emotions.happy / 100,
          sad: emotions.sad / 100,
          angry: emotions.angry / 100,
          fearful: emotions.fearful / 100,
          disgusted: emotions.disgusted / 100,
          surprised: emotions.surprised / 100
        };
        const score = await calculateEmotionScore(movie, normalizedEmotions);
        setEmotionScore(score);
      };
      getScore();
    }, [movie, emotions, calculateEmotionScore]);

    return (
      <div className={`mt-6 p-6 rounded-2xl border ${
        theme === 'dark' 
          ? 'bg-gray-800/50 border-gray-700/50' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-xl font-bold ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            {movie.title}
          </h3>
          <button
            onClick={onClear}
            className={`text-xs px-3 py-1 rounded-full transition-colors ${
              theme === 'dark'
                ? 'text-gray-400 hover:text-white hover:bg-gray-600'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
            }`}
          >
            <i className="fas fa-times mr-1"></i>
            Clear
          </button>
        </div>
        
        <div className="flex items-start gap-6">
          <img
            src={movie.poster_path ? `https://image.tmdb.org/t/p/w300${movie.poster_path}` : '/placeholder-movie.png'}
            alt={movie.title}
            className="w-32 h-48 object-cover rounded-xl"
          />
          
          <div className="flex-1">
            <div className="mb-4">
              <div className="text-center mb-2">
                <div className="text-4xl font-bold text-cinema-600">
                  {emotionScore !== null ? Math.round(emotionScore * 100) : <LoadingSpinner size="sm" message="" />}%
                </div>
                <div className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Emotion Match Score
                </div>
              </div>
              
              {emotionScore !== null && (
                <div className={`mt-4 p-4 rounded-xl ${
                  emotionScore > 0.7 ? 'bg-green-500/20 border border-green-500/30' :
                  emotionScore > 0.4 ? 'bg-yellow-500/20 border border-yellow-500/30' :
                  'bg-red-500/20 border border-red-500/30'
                }`}>
                  <p className={`text-sm ${
                    emotionScore > 0.7 ? 'text-green-300' :
                    emotionScore > 0.4 ? 'text-yellow-300' :
                    'text-red-300'
                  }`}>
                    {emotionScore > 0.7 ? 'Excellent match! This movie aligns well with your current emotions.' :
                     emotionScore > 0.4 ? 'Good match. This movie moderately fits your emotional state.' :
                     'Lower match. This movie may not align with your current emotions.'}
                  </p>
                </div>
              )}
            </div>
            
            <div className={`text-sm mb-2 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {movie.release_date ? new Date(movie.release_date).getFullYear() : 'Unknown Year'} • 
              ⭐ {movie.vote_average?.toFixed(1) || 'N/A'} • 
              {Math.round(movie.popularity)} popularity
            </div>
            
            <p className={`text-sm ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>
              {movie.overview || 'No description available.'}
            </p>
            
            <div className="mt-4">
              <button
                onClick={() => window.location.href = `/movie/${movie.id}`}
                className="px-4 py-2 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors"
              >
                View Details
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen pb-32">
      {/* Header */}
      <div className={`border-b backdrop-blur-sm ${
        theme === 'dark' 
          ? 'border-gray-700 bg-gray-900/80' 
          : 'border-gray-200 bg-white/80'
      }`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-cinema-600 to-film-600 rounded-full flex items-center justify-center shadow-cinema mx-auto mb-4">
              <i className="fas fa-search text-white text-2xl"></i>
            </div>
            <h1 className={`text-3xl font-bold mb-2 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Movie Match
            </h1>
            <p className={`text-lg ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Search any movie and see how well it matches your current emotional state
            </p>
          </div>
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Current Emotions */}
          <div className={`rounded-2xl border backdrop-blur-sm shadow-lg p-6 ${
            theme === 'dark' 
              ? 'bg-gray-800/50 border-gray-700/50 shadow-black/20' 
              : 'bg-white/80 border-gray-300/50 shadow-gray-900/10'
          }`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-xl font-bold flex items-center gap-2 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                <i className="fas fa-heart text-red-500"></i>
                Your Current Emotions
              </h2>
              <button
                onClick={resetEmotions}
                className={`text-sm px-3 py-1 rounded-full transition-colors ${
                  theme === 'dark'
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Reset
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(Object.keys(emotions) as (keyof EmotionScores)[]).map(emotion => {
                const info = emotionInfo[emotion];
                return (
                  <div key={emotion} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className={`text-sm font-medium flex items-center gap-2 ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        <i className={`${info.icon} ${info.color}`}></i>
                        {info.label}
                      </label>
                      <span className={`text-sm font-mono font-bold ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {emotions[emotion]}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={emotions[emotion]}
                      onChange={(e) => handleEmotionChange(emotion, parseInt(e.target.value))}
                      className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${
                        theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                      }`}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Movie Search */}
          <div className={`rounded-2xl border backdrop-blur-sm shadow-lg p-6 ${
            theme === 'dark' 
              ? 'bg-gray-800/50 border-gray-700/50 shadow-black/20' 
              : 'bg-white/80 border-gray-300/50 shadow-gray-900/10'
          }`}>
            <h2 className={`text-xl font-bold mb-4 flex items-center gap-2 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              <i className="fas fa-search text-blue-500"></i>
              Search Movie
            </h2>
            
            <div className="relative">
              <input
                type="text"
                placeholder="Type any movie title to see how well it matches your emotions..."
                value={movieSearchQuery}
                onChange={(e) => handleMovieSearchQueryChange(e.target.value)}
                onFocus={() => movieSearchQuery.length >= 2 && setShowAutocomplete(true)}
                onBlur={() => setTimeout(() => setShowAutocomplete(false), 200)}
                className={`w-full px-4 py-3 rounded-xl border transition-colors text-lg ${
                  theme === 'dark'
                    ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-purple-500'
                } focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
              />
              
              {/* Autocomplete Dropdown */}
              {showAutocomplete && autocompleteResults.length > 0 && (
                <div className={`absolute top-full left-0 right-0 mt-2 rounded-xl border shadow-xl z-50 max-h-64 overflow-y-auto ${
                  theme === 'dark'
                    ? 'bg-gray-800/95 border-gray-700 backdrop-blur-sm'
                    : 'bg-white/95 border-gray-200 backdrop-blur-sm'
                }`}>
                  {autocompleteResults.map((movie) => (
                    <div
                      key={movie.id}
                      onClick={() => handleAutocompleteSelect(movie)}
                      className={`flex items-center p-4 cursor-pointer transition-colors ${
                        theme === 'dark'
                          ? 'hover:bg-gray-700 text-white'
                          : 'hover:bg-gray-50 text-gray-900'
                      } first:rounded-t-xl last:rounded-b-xl border-b border-gray-200 dark:border-gray-700 last:border-b-0`}
                    >
                      <img
                        src={movie.poster_path ? `https://image.tmdb.org/t/p/w92${movie.poster_path}` : '/placeholder-movie.png'}
                        alt={movie.title}
                        className="w-12 h-18 object-cover rounded mr-4"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium">{movie.title}</h4>
                        <p className={`text-sm ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {movie.release_date ? new Date(movie.release_date).getFullYear() : 'Unknown Year'} • 
                          ⭐ {movie.vote_average?.toFixed(1) || 'N/A'}
                        </p>
                      </div>
                      <i className="fas fa-arrow-right text-cinema-500"></i>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {selectedSearchMovie && (
              <SearchMovieDisplay 
                movie={selectedSearchMovie}
                emotions={emotions}
                theme={theme}
                onClear={clearMovieSearch}
                calculateEmotionScore={calculateEmotionScore}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieMatch;