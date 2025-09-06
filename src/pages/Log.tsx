/**
 * Log Page Component
 * 
 * Movie emotion logging interface that allows users to:
 * 1. Search for movies they've watched
 * 2. Capture or input their emotions while watching
 * 3. Save the movie to their watch history with emotion data
 * 
 * Supports movie search with autocomplete, emotion detection via webcam/upload,
 * and manual emotion input as fallback options.
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useEmotion } from '../contexts/EmotionContext';
import { EmotionScores } from '../types/emotion';
import { Movie } from '../types/movie';
import { GetMovieDetails, SearchMovies } from '../services/tmdbApi';
import { LoadingSpinner } from '../components/common';
import { EmotionCapture } from '../components/EmotionCapture';
import EmotionDisplay from '../components/features/emotion/EmotionDisplay';

/**
 * Log page component for recording movie emotions.
 * Multi-step process: movie search → emotion capture → save to history.
 */
const Log: React.FC = () => {
  const { theme } = useTheme();
  const { updateMovieEmotion, addToWatchHistory } = useEmotion();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [currentStep, setCurrentStep] = useState<'search' | 'emotions' | 'complete'>('search');
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [movieQuery, setMovieQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [autocompleteResults, setAutocompleteResults] = useState<Movie[]>([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emotions, setEmotions] = useState<EmotionScores>({
    neutral: 0,
    happy: 0,
    sad: 0,
    angry: 0,
    fearful: 0,
    disgusted: 0,
    surprised: 0
  });
  const [, setDetectionMethod] = useState<'webcam' | 'manual'>('manual');

  useEffect(() => {
    const movieIdParam = searchParams.get('movieId');
    const modeParam = searchParams.get('mode');

    if (movieIdParam) {
      loadMovieFromId(parseInt(movieIdParam));
    } else if (modeParam === 'complex') {
      setCurrentStep('emotions');
    }
  }, [searchParams]);

  const loadMovieFromId = async (movieId: number) => {
    setLoading(true);
    try {
      const movie = await GetMovieDetails(movieId);
      if (movie) {
        setSelectedMovie(movie);
        setCurrentStep('emotions');
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleMovieSearch = async () => {
    if (!movieQuery.trim()) return;

    setLoading(true);
    setShowAutocomplete(false);
    try {
      const response = await SearchMovies(movieQuery);
      setSearchResults(response.results.slice(0, 10));
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleAutocompleteSearch = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setAutocompleteResults([]);
      setShowAutocomplete(false);
      return;
    }

    try {
      const response = await SearchMovies(query);
      setAutocompleteResults(response.results.slice(0, 5));
      setShowAutocomplete(true);
    } catch (error) {
      setAutocompleteResults([]);
      setShowAutocomplete(false);
    }
  };

  const handleMovieQueryChange = (value: string) => {
    setMovieQuery(value);
    const windowWithTimeout = window as typeof window & { autocompleteTimeout?: NodeJS.Timeout };
    clearTimeout(windowWithTimeout.autocompleteTimeout);
    windowWithTimeout.autocompleteTimeout = setTimeout(() => {
      handleAutocompleteSearch(value);
    }, 300);
  };

  const handleAutocompleteSelect = (movie: Movie) => {
    setMovieQuery(movie.title);
    setSelectedMovie(movie);
    setShowAutocomplete(false);
    setAutocompleteResults([]);
    setCurrentStep('emotions');
  };

  const handleMovieSelect = (movie: Movie) => {
    setSelectedMovie(movie);
    setCurrentStep('emotions');
  };

  const handleEmotionSubmit = async (emotionScores: EmotionScores, method: 'webcam' | 'manual' | 'upload', confidence?: number) => {
    // Prevent submission if no movie is selected
    if (!selectedMovie) {
      return;
    }

    setEmotions(emotionScores);
    setDetectionMethod(method as 'webcam' | 'manual');
    
    try {
      // Update movie emotion with correct method and confidence
      updateMovieEmotion(selectedMovie.id, emotionScores, method, confidence);
      
      // Add to watch history with emotions
      await addToWatchHistory(selectedMovie, emotionScores, undefined, confidence);

      setCurrentStep('complete');
    } catch (error) {
      console.error('Error logging emotions:', error);
      // You could add a toast notification here to show the error to the user
      alert('Failed to log emotions. Please try again.');
    }
  };

  const handleStartOver = () => {
    setCurrentStep('search');
    setSelectedMovie(null);
    setMovieQuery('');
    setSearchResults([]);
    setAutocompleteResults([]);
    setShowAutocomplete(false);
    setEmotions({
      neutral: 0,
      happy: 0,
      sad: 0,
      angry: 0,
      fearful: 0,
      disgusted: 0,
      surprised: 0
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className={`text-4xl md:text-5xl font-bold tracking-tight mb-4 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Emotion Log
          </h1>
          <p className={`text-xl font-medium ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Track your emotional response to movies
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex justify-center mb-12">
          <div className="flex items-center space-x-4">
            {['search', 'emotions', 'complete'].map((step, index) => (
              <div key={step} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  currentStep === step 
                    ? 'bg-cinema-600 text-white shadow-cinema' 
                    : index < ['search', 'emotions', 'complete'].indexOf(currentStep)
                    ? 'bg-green-500 text-white'
                    : theme === 'dark' 
                    ? 'bg-slate-700 text-gray-400' 
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {index + 1}
                </div>
                {index < 2 && (
                  <div className={`w-16 h-1 mx-2 ${
                    index < ['search', 'emotions', 'complete'].indexOf(currentStep)
                      ? 'bg-green-500'
                      : theme === 'dark' ? 'bg-slate-700' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className={`rounded-2xl border backdrop-blur-sm shadow-lg p-8 ${
          theme === 'dark' 
            ? 'bg-slate-800/30 border-slate-700/50 shadow-black/20' 
            : 'bg-white/60 border-gray-200/50 shadow-gray-900/5'
        }`}>
          {currentStep === 'search' && (
            <div className="space-y-8">
              <div className="text-center mb-8">
                <h2 className={`text-2xl font-bold mb-4 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  What movie did you watch?
                </h2>
                <p className={`text-lg ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Search for the movie you want to log emotions for
                </p>
              </div>

              <div className="relative mb-8">
                <div className="flex gap-4">
                  <input
                    type="text"
                    value={movieQuery}
                    onChange={(e) => handleMovieQueryChange(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleMovieSearch()}
                    onFocus={() => movieQuery.length >= 2 && setShowAutocomplete(true)}
                    onBlur={() => setTimeout(() => setShowAutocomplete(false), 200)}
                    placeholder="Enter movie title..."
                    className={`flex-1 px-4 py-3 rounded-xl border-2 transition-colors ${
                      theme === 'dark'
                        ? 'bg-slate-700/50 border-slate-600 text-white placeholder-gray-400 focus:border-purple-500'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-purple-500'
                    } focus:outline-none`}
                  />
                  <button
                    onClick={handleMovieSearch}
                    disabled={!movieQuery.trim()}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <i className="fas fa-search mr-2"></i>
                    Search
                  </button>
                </div>

                {/* Autocomplete Dropdown */}
                {showAutocomplete && autocompleteResults.length > 0 && (
                  <div className={`absolute top-full left-0 right-16 mt-1 rounded-xl border shadow-lg z-10 ${
                    theme === 'dark'
                      ? 'bg-slate-800 border-slate-700'
                      : 'bg-white border-gray-200'
                  }`}>
                    {autocompleteResults.map((movie) => (
                      <div
                        key={movie.id}
                        onClick={() => handleAutocompleteSelect(movie)}
                        className={`flex items-center p-3 cursor-pointer transition-colors ${
                          theme === 'dark'
                            ? 'hover:bg-slate-700 text-white'
                            : 'hover:bg-gray-50 text-gray-900'
                        } first:rounded-t-xl last:rounded-b-xl`}
                      >
                        <img
                          src={movie.poster_path ? `https://image.tmdb.org/t/p/w92${movie.poster_path}` : '/placeholder-movie.png'}
                          alt={movie.title}
                          className="w-8 h-12 object-cover rounded mr-3"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{movie.title}</h4>
                          <p className={`text-xs ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            {movie.release_date ? new Date(movie.release_date).getFullYear() : 'Unknown Year'}
                          </p>
                        </div>
                        <i className="fas fa-arrow-right text-xs opacity-50"></i>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {searchResults.length > 0 && (
                <div className="space-y-4">
                  <h3 className={`text-xl font-semibold ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    Search Results
                  </h3>
                  <div className="grid gap-4">
                    {searchResults.map((movie) => (
                      <div
                        key={movie.id}
                        onClick={() => handleMovieSelect(movie)}
                        className={`flex items-center p-4 rounded-xl border cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${
                          theme === 'dark'
                            ? 'bg-slate-700/50 border-slate-600 hover:border-purple-500'
                            : 'bg-white border-gray-200 hover:border-purple-500'
                        }`}
                      >
                        <img
                          src={movie.poster_path ? `https://image.tmdb.org/t/p/w92${movie.poster_path}` : '/placeholder-movie.png'}
                          alt={movie.title}
                          className="w-16 h-24 object-cover rounded-lg mr-4"
                        />
                        <div>
                          <h4 className={`font-semibold text-lg ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>
                            {movie.title}
                          </h4>
                          <p className={`text-sm ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            {movie.release_date ? new Date(movie.release_date).getFullYear() : 'Unknown Year'}
                          </p>
                          <p className={`text-sm line-clamp-2 ${
                            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            {movie.overview}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {searchResults.length === 0 && movieQuery.trim() && (
                <div className={`text-center p-4 rounded-xl ${
                  theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'
                }`}>
                  <i className={`fas fa-search text-2xl mb-2 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}></i>
                  <p className={`text-sm ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    No movies found. Try a different search term.
                  </p>
                </div>
              )}
            </div>
          )}

          {currentStep === 'emotions' && (
            <div className="space-y-8">
              {selectedMovie ? (
                <div className="text-center mb-8">
                  {/* Movie Display Card */}
                  <div className={`max-w-md mx-auto p-6 rounded-2xl border backdrop-blur-sm shadow-lg mb-6 ${
                    theme === 'dark' 
                      ? 'bg-gray-800/50 border-gray-700/50 shadow-black/20' 
                      : 'bg-white/80 border-gray-300/50 shadow-gray-900/10'
                  }`}>
                    <div className="flex items-center space-x-4">
                      <img
                        src={selectedMovie.poster_path ? `https://image.tmdb.org/t/p/w154${selectedMovie.poster_path}` : '/placeholder-movie.png'}
                        alt={selectedMovie.title}
                        className="w-20 h-30 object-cover rounded-lg shadow-md"
                      />
                      <div className="flex-1 text-left">
                        <h3 className={`text-lg font-bold mb-1 ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>
                          {selectedMovie.title}
                        </h3>
                        <p className={`text-sm mb-2 ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {selectedMovie.release_date ? new Date(selectedMovie.release_date).getFullYear() : 'Unknown Year'}
                        </p>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center">
                            <i className="fas fa-star text-yellow-500 text-sm mr-1"></i>
                            <span className={`text-sm font-medium ${
                              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              {selectedMovie.vote_average?.toFixed(1) || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <h2 className={`text-2xl font-bold mb-4 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    How did this movie make you feel?
                  </h2>
                  <p className={`text-lg ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    Rate your emotional response to help improve recommendations
                  </p>
                </div>
              ) : (
                <div className={`text-center mb-8 p-6 rounded-2xl border ${
                  theme === 'dark' 
                    ? 'bg-amber-900/20 border-amber-500/50 text-amber-200' 
                    : 'bg-amber-50 border-amber-200 text-amber-800'
                }`}>
                  <i className="fas fa-exclamation-triangle text-3xl mb-4"></i>
                  <h2 className="text-xl font-bold mb-2">No Movie Selected</h2>
                  <p className="text-sm mb-4">
                    You must select a movie before logging emotions. This helps us provide better recommendations.
                  </p>
                  <button
                    onClick={() => setCurrentStep('search')}
                    className="px-6 py-2 bg-amber-600 text-white font-semibold rounded-xl hover:bg-amber-700 transition-colors"
                  >
                    Select a Movie
                  </button>
                </div>
              )}

              {selectedMovie && (
                <>
                  <EmotionCapture
                    onEmotionsDetected={handleEmotionSubmit}
                    onCancel={() => setCurrentStep('search')}
                  />

                  <div className="flex justify-center mt-4">
                    <button
                      onClick={() => setCurrentStep('search')}
                      className={`text-sm font-semibold underline transition-colors ${
                        theme === 'dark' 
                          ? 'text-gray-400 hover:text-white' 
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Change movie selection
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {currentStep === 'complete' && (
            <div className="text-center space-y-8">
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
                <i className="fas fa-check text-white text-2xl"></i>
              </div>

              {selectedMovie && (
                <div className={`max-w-md mx-auto p-4 rounded-2xl border backdrop-blur-sm shadow-lg mb-6 ${
                  theme === 'dark' 
                    ? 'bg-gray-800/50 border-gray-700/50 shadow-black/20' 
                    : 'bg-white/80 border-gray-300/50 shadow-gray-900/10'
                }`}>
                  <div className="flex items-center space-x-3">
                    <img
                      src={selectedMovie.poster_path ? `https://image.tmdb.org/t/p/w92${selectedMovie.poster_path}` : '/placeholder-movie.png'}
                      alt={selectedMovie.title}
                      className="w-12 h-18 object-cover rounded-lg shadow-md"
                    />
                    <div className="flex-1 text-left">
                      <h3 className={`text-md font-bold ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {selectedMovie.title}
                      </h3>
                      <p className={`text-xs ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {selectedMovie.release_date ? new Date(selectedMovie.release_date).getFullYear() : 'Unknown Year'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <h2 className={`text-2xl font-bold mb-4 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  Emotions Logged Successfully!
                </h2>
                <p className={`text-lg ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {selectedMovie 
                    ? `Your emotional response to "${selectedMovie.title}" has been recorded.`
                    : 'Your emotions have been recorded.'
                  }
                </p>
              </div>

              <div className={`p-6 rounded-xl ${
                theme === 'dark' ? 'bg-slate-700/50' : 'bg-gray-50'
              }`}>
                <h3 className={`text-lg font-semibold mb-4 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  Your Emotions:
                </h3>
                <EmotionDisplay emotions={emotions} />
              </div>

              <div className="flex justify-center gap-4">
                <button
                  onClick={handleStartOver}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                    theme === 'dark'
                      ? 'bg-slate-700 text-white hover:bg-slate-600'
                      : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                  }`}
                >
                  Log Another Movie
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="btn-primary"
                >
                  Back to Home
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Log;