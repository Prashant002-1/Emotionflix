import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useEmotion } from '../contexts/EmotionContext';
import { useUser } from '../contexts/UserContext';
import { recommendationService } from '../services/recommendationService';
import { GetGenres, GetMoviesByGenres, GetPopularMovies } from '../services/tmdbApi';
import { Movie, Genre } from '../types/movie';
import { EmotionScores } from '../types/emotion';
import { LoadingSpinner } from '../components/common';
import AuthModal from '../components/auth/AuthModal';
import { personalizedEmotionMappingService } from '../services/personalizedEmotionMapping';

// Enhanced Movie type with recommendation data
type EnhancedMovie = Movie & {
  emotionScore?: number;
};

const Recommendations: React.FC = () => {
  const { theme } = useTheme();
  const { isInWatchlist } = useEmotion();
  const { user } = useUser();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [movies, setMovies] = useState<EnhancedMovie[]>([]);
  const [filteredMovies, setFilteredMovies] = useState<EnhancedMovie[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showEmotionModal, setShowEmotionModal] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const moviesPerPage = 24;
  
  // Initialize filter states from URL params
  const [selectedGenres, setSelectedGenres] = useState<number[]>(() => {
    const genres = searchParams.get('genres');
    return genres ? genres.split(',').map(Number).filter(Boolean) : [];
  });
  const [yearRange, setYearRange] = useState(() => {
    const minYear = searchParams.get('minYear');
    const maxYear = searchParams.get('maxYear');
    return {
      min: minYear ? parseInt(minYear) : 1990,
      max: maxYear ? parseInt(maxYear) : new Date().getFullYear()
    };
  });
  const [ratingRange, setRatingRange] = useState(() => {
    const minRating = searchParams.get('minRating');
    return {
      min: minRating ? parseFloat(minRating) : 0,
      max: 10
    };
  });
  const [sortBy, setSortBy] = useState<'popularity' | 'rating' | 'release_date' | 'emotion_match'>(() => {
    const sort = searchParams.get('sort') as 'popularity' | 'rating' | 'release_date' | 'emotion_match';
    return sort || 'emotion_match';
  });
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('search') || '');
  const [isGenreFilterOpen, setIsGenreFilterOpen] = useState(true);
  
  
  // Emotion slider state
  const [emotions, setEmotions] = useState<EmotionScores>({
    neutral: 20,
    happy: 30,
    sad: 10,
    angry: 10,
    fearful: 10,
    disgusted: 5,
    surprised: 15
  });

  // Algorithm confidence and explanation
  const [algorithmInsights, setAlgorithmInsights] = useState<{
    confidence: number;
    reasoning: string[];
    matchingGenres: string[];
    totalFound: number;
    emotionProfile: EmotionScores;
  }>({
    confidence: 0,
    reasoning: [],
    matchingGenres: [],
    totalFound: 0,
    emotionProfile: emotions
  });


  // Load genres on component mount
  useEffect(() => {
    const loadGenres = async () => {
      try {
        const genreResponse = await GetGenres();
        setGenres(genreResponse.genres);
      } catch (error) {
      }
    };
    loadGenres();
  }, []);

  const fetchRecommendations = useCallback(async (currentEmotions: EmotionScores) => {
    const currentNormalizedEmotions: EmotionScores = {
      neutral: currentEmotions.neutral / 100,
      happy: currentEmotions.happy / 100,
      sad: currentEmotions.sad / 100,
      angry: currentEmotions.angry / 100,
      fearful: currentEmotions.fearful / 100,
      disgusted: currentEmotions.disgusted / 100,
      surprised: currentEmotions.surprised / 100
    };
    setLoading(true);
    setError(null);
    
    try {
      if (!user?.id) {
        setShowAuthModal(true);
        return;
      }
      
      const emotionGenreIds = await personalizedEmotionMappingService.getPersonalizedGenreRecommendations(
        user.id.toString(),
        currentNormalizedEmotions
      );
      
      // Fetch movies based ONLY on emotion-mapped genres (emotion-driven approach)
      const MAX_MOVIES_TOTAL = 500;
      const MOVIES_PER_GENRE_PAGE = 20;
      let allEmotionMovies: Movie[] = [];
      
      if (emotionGenreIds.length > 0) {
        // Calculate how many pages per genre to fetch based on number of genres
        const maxPagesPerGenre = Math.min(2, Math.ceil(MAX_MOVIES_TOTAL / (emotionGenreIds.length * MOVIES_PER_GENRE_PAGE)));
        
        // Fetch from multiple pages of emotion-matched genres for variety
        const emotionBasedPromises = emotionGenreIds.map(async (genreId) => {
          const pagePromises = [];
          for (let page = 1; page <= maxPagesPerGenre; page++) {
            pagePromises.push(GetMoviesByGenres([genreId], page));
          }
          const responses = await Promise.all(pagePromises);
          return responses.flatMap(response => response.results);
        });
        
        const emotionMoviesByGenre = await Promise.all(emotionBasedPromises);
        allEmotionMovies = emotionMoviesByGenre.flat();
        
        if (allEmotionMovies.length > MAX_MOVIES_TOTAL) {
          allEmotionMovies = allEmotionMovies.slice(0, MAX_MOVIES_TOTAL);
        }
      }
      
      // If no emotion-based movies found, fallback to popular movies
      if (allEmotionMovies.length === 0) {
        const fallbackResponse = await GetPopularMovies(1);
        allEmotionMovies = fallbackResponse.results;
      }
      
      // Deduplicate movies by ID
      const movieMap = new Map<number, Movie>();
      allEmotionMovies.forEach(movie => {
        if (!movieMap.has(movie.id)) {
          movieMap.set(movie.id, movie);
        }
      });
      
      const uniqueMovies = Array.from(movieMap.values());
      
      // Score and sort movies by emotion match (PRIMARY), then by quality
      const scoredMovies = await Promise.all(
        uniqueMovies.map(async movie => ({
          ...movie,
          emotionScore: await calculateEmotionScore(movie, currentNormalizedEmotions)
        }))
      );
      
      scoredMovies.sort((a, b) => {
        // PRIMARY: Sort by emotion match score (highest first)
        if (b.emotionScore !== a.emotionScore) {
          return b.emotionScore - a.emotionScore;
        }
        // SECONDARY: If emotion scores are equal, sort by rating
        if (b.vote_average !== a.vote_average) {
          return b.vote_average - a.vote_average;
        }
        // TERTIARY: If ratings are equal, sort by popularity
        return b.popularity - a.popularity;
      });
      
      setMovies(scoredMovies);
      setCurrentPage(1);
      
      // Update algorithm insights with meaningful data
      const dominantEmotion = Object.entries(currentEmotions).reduce((a, b) => 
        currentEmotions[a[0] as keyof EmotionScores] > currentEmotions[b[0] as keyof EmotionScores] ? a : b
      )[0];
      
      const averageEmotionScore = scoredMovies.length > 0 
        ? scoredMovies.reduce((sum, movie) => sum + (movie.emotionScore || 0), 0) / scoredMovies.length
        : 0;
      
      setAlgorithmInsights({
        confidence: Math.round(averageEmotionScore * 100),
        reasoning: [],
        matchingGenres: getMatchingGenres(dominantEmotion).slice(0, emotionGenreIds.length),
        totalFound: uniqueMovies.length,
        emotionProfile: currentEmotions
      });

    } catch (err) {
      setError('Failed to load recommendations. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []); 
  
  // Fetch recommendations when emotions change (with debouncing)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchRecommendations(emotions);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [emotions, fetchRecommendations]); 

  // Calculate emotion compatibility score for a movie using personalized mappings
  const calculateEmotionScore = async (movie: Movie, emotions: EmotionScores): Promise<number> => {
    if (!user?.id) {
      return 0.5; // Default score for unauthenticated users
    }
    
    const emotionCompatibility = await recommendationService.calculateEmotionCompatibility(
      emotions, 
      movie.genre_ids, 
      user.id.toString()
    );
    
    // Quality score from rating and popularity
    const qualityScore = (movie.vote_average / 10) * 0.2 + (Math.log10(movie.popularity) / 4) * 0.1;
    
    // Weighted combination favoring emotion match
    return emotionCompatibility * 0.8 + qualityScore * 0.2;
  };
  
  const getMatchingGenres = (dominantEmotion: string): string[] => {
    const genreMapping: Record<string, string[]> = {
      happy: ['Comedy', 'Family', 'Animation', 'Romance'],
      sad: ['Drama', 'Romance', 'War', 'Biography'],
      angry: ['Action', 'Thriller', 'Crime', 'Western'],
      fearful: ['Horror', 'Thriller', 'Mystery', 'Suspense'],
      surprised: ['Science Fiction', 'Fantasy', 'Mystery', 'Adventure'],
      neutral: ['Drama', 'Documentary', 'Biography', 'History'],
      disgusted: ['Horror', 'Thriller', 'Dark Comedy', 'Crime']
    };
    return genreMapping[dominantEmotion] || ['Drama', 'Adventure'];
  };

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (selectedGenres.length > 0) {
      params.set('genres', selectedGenres.join(','));
    }
    if (yearRange.min !== 1990) {
      params.set('minYear', yearRange.min.toString());
    }
    if (yearRange.max !== new Date().getFullYear()) {
      params.set('maxYear', yearRange.max.toString());
    }
    if (ratingRange.min !== 0) {
      params.set('minRating', ratingRange.min.toString());
    }
    if (sortBy !== 'emotion_match') {
      params.set('sort', sortBy);
    }
    if (searchQuery.trim()) {
      params.set('search', searchQuery);
    }
    
    setSearchParams(params, { replace: true });
  }, [selectedGenres, yearRange, ratingRange, sortBy, searchQuery, setSearchParams]);

  // Filter and sort movies based on current filters
  useEffect(() => {
    let filtered = [...movies];
    
    // Genre filter
    if (selectedGenres.length > 0) {
      filtered = filtered.filter(movie => 
        movie.genre_ids.some(genreId => selectedGenres.includes(genreId))
      );
    }
    
    // Year filter
    filtered = filtered.filter(movie => {
      const year = movie.release_date ? new Date(movie.release_date).getFullYear() : 0;
      return year >= yearRange.min && year <= yearRange.max;
    });
    
    // Rating filter
    filtered = filtered.filter(movie => 
      movie.vote_average >= ratingRange.min && movie.vote_average <= ratingRange.max
    );
    
    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(movie => 
        movie.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        movie.overview.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    filtered.sort((a, b) => {
      // PRIMARY: Always sort by emotion match score first
      const emotionDiff = (b.emotionScore || 0) - (a.emotionScore || 0);
      if (Math.abs(emotionDiff) > 0.01) { 
        return emotionDiff;
      }
      
      // SECONDARY: Apply user-selected sort for movies with similar emotion scores
      switch (sortBy) {
        case 'popularity':
          return b.popularity - a.popularity;
        case 'rating':
          return b.vote_average - a.vote_average;
        case 'release_date':
          return new Date(b.release_date || '').getTime() - new Date(a.release_date || '').getTime();
        case 'emotion_match':
          return 0; 
        default:
          return b.vote_average - a.vote_average; 
      }
    });
    
    setFilteredMovies(filtered);
    setCurrentPage(1);
  }, [movies, selectedGenres, yearRange, ratingRange, sortBy, searchQuery]);
  
  
  const resetFilters = () => {
    setSelectedGenres([]);
    setYearRange({ min: 1990, max: new Date().getFullYear() });
    setRatingRange({ min: 0, max: 10 });
    setSortBy('emotion_match');
    setSearchQuery('');
  };

  // Movie interaction handlers
  const handleMovieClick = async (movieId: number) => {
    if (!user?.id) {
      setShowAuthModal(true);
      return;
    }
    
    const movie = movies.find(m => m.id === movieId);
    if (movie) {
      await personalizedEmotionMappingService.updateUserMappingFromInteraction(
        user.id.toString(),
        movie.genre_ids,
        {
          neutral: emotions.neutral / 100,
          happy: emotions.happy / 100,
          sad: emotions.sad / 100,
          angry: emotions.angry / 100,
          fearful: emotions.fearful / 100,
          disgusted: emotions.disgusted / 100,
          surprised: emotions.surprised / 100
        },
        'logged'
      );
    }
    navigate(`/movie/${movieId}`);
  };




  const emotionInfo = {
    neutral: { icon: 'fas fa-meh', color: 'gray', label: 'Neutral' },
    happy: { icon: 'fas fa-smile', color: 'yellow', label: 'Happy' },
    sad: { icon: 'fas fa-frown', color: 'blue', label: 'Sad' },
    angry: { icon: 'fas fa-angry', color: 'red', label: 'Angry' },
    fearful: { icon: 'fas fa-grimace', color: 'purple', label: 'Fearful' },
    disgusted: { icon: 'fas fa-dizzy', color: 'green', label: 'Disgusted' },
    surprised: { icon: 'fas fa-surprise', color: 'orange', label: 'Surprised' }
  };

  
  // Emotion Profile Modal Component
  const EmotionProfileModal = () => {
    const [tempEmotions, setTempEmotions] = useState<EmotionScores>(emotions);
    
    const handleSave = () => {
      setEmotions(tempEmotions);
      setShowEmotionModal(false);
    };
    
    const handleCancel = () => {
      setTempEmotions(emotions);
      setShowEmotionModal(false);
    };
    
    if (!showEmotionModal) return null;
    
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className={`rounded-2xl border shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden ${
          theme === 'dark' 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-300'
        }`}>
          <div className="p-6 border-b border-gray-700/50">
            <div className="flex items-center justify-between">
              <h2 className={`text-2xl font-bold flex items-center gap-3 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                <div className="w-10 h-10 bg-cinema-600 rounded-full flex items-center justify-center shadow-cinema">
                  <i className="fas fa-brain text-white"></i>
                </div>
                Edit Emotion Profile
              </h2>
              <button
                onClick={handleCancel}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  theme === 'dark' 
                    ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
                    : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                }`}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <p className={`mt-2 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Adjust your emotional state to get better movie recommendations
            </p>
          </div>
          
          <div className="p-6 max-h-96 overflow-y-auto">
            <div className="space-y-6">
              {(Object.keys(tempEmotions) as (keyof EmotionScores)[]).map(emotion => {
                const info = emotionInfo[emotion];
                return (
                  <div key={emotion} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className={`text-lg font-medium flex items-center gap-3 ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        <i className={`${info.icon} text-xl text-${info.color}-500`}></i>
                        {info.label}
                      </label>
                      <span className={`text-xl font-mono font-bold ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {tempEmotions[emotion]}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={tempEmotions[emotion]}
                      onChange={(e) => setTempEmotions(prev => ({ ...prev, [emotion]: parseInt(e.target.value) }))}
                      className={`w-full h-3 rounded-lg appearance-none cursor-pointer ${
                        theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                      } slider-${info.color}`}
                    />
                  </div>
                );
              })}
            </div>
            
            <div className="mt-8 grid grid-cols-2 gap-3">
              {(['happy', 'sad', 'angry', 'fearful', 'excited', 'calm'] as const).map(preset => {
                const presets = {
                  happy: { neutral: 10, happy: 70, sad: 5, angry: 5, fearful: 5, disgusted: 2, surprised: 3 },
                  sad: { neutral: 15, happy: 5, sad: 60, angry: 5, fearful: 10, disgusted: 2, surprised: 3 },
                  angry: { neutral: 10, happy: 5, sad: 10, angry: 60, fearful: 5, disgusted: 8, surprised: 2 },
                  fearful: { neutral: 10, happy: 5, sad: 15, angry: 10, fearful: 55, disgusted: 2, surprised: 3 },
                  excited: { neutral: 10, happy: 50, sad: 2, angry: 3, fearful: 5, disgusted: 2, surprised: 28 },
                  calm: { neutral: 70, happy: 20, sad: 3, angry: 2, fearful: 2, disgusted: 1, surprised: 2 }
                };
                
                return (
                  <button
                    key={preset}
                    onClick={() => setTempEmotions(presets[preset])}
                    className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 ${
                      theme === 'dark'
                        ? 'bg-gray-700/50 text-white hover:bg-gray-600/50'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {preset.charAt(0).toUpperCase() + preset.slice(1)}
                  </button>
                );
              })}
            </div>
          </div>
          
          <div className="p-6 border-t border-gray-700/50 flex items-center justify-end gap-3">
            <button
              onClick={handleCancel}
              className={`px-6 py-3 rounded-xl font-medium transition-colors ${
                theme === 'dark'
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="btn-primary"
            >
              Apply Changes
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredMovies.length / moviesPerPage);
  const startIndex = (currentPage - 1) * moviesPerPage;
  const endIndex = startIndex + moviesPerPage;
  const currentMovies = filteredMovies.slice(startIndex, endIndex);

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className={`rounded-2xl border backdrop-blur-sm shadow-lg p-8 text-center ${
          theme === 'dark' 
            ? 'bg-red-900/20 border-red-500/50 text-red-300' 
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          <i className="fas fa-exclamation-triangle text-4xl mb-4"></i>
          <h2 className="text-xl font-bold mb-2">Oops! Something went wrong</h2>
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <EmotionProfileModal />
      
      {/* Header */}
      <div className={`border-b backdrop-blur-sm ${
        theme === 'dark' 
          ? 'border-gray-700/50 bg-gray-800/30' 
          : 'border-gray-200/50 bg-white/80'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-cinema-600 rounded-full flex items-center justify-center shadow-cinema">
                <i className="fas fa-brain text-white text-xl"></i>
              </div>
              <div>
                <h1 className={`text-2xl font-bold ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  Movie Recommendations
                </h1>
                <p className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Powered by emotion detection & intelligent filtering
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => window.location.href = '/movie-match'}
                className="btn-secondary flex items-center gap-2 px-4 py-2"
              >
                <i className="fas fa-search"></i>
                Movie Match
              </button>
              <button
                onClick={() => setShowEmotionModal(true)}
                className="btn-primary flex items-center gap-2 px-4 py-2"
              >
                <i className="fas fa-brain"></i>
                Edit Emotions
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Left Sidebar - Filters */}
          <div className="w-80 space-y-6">
            {/* Current Emotion Profile */}
            <div className={`rounded-2xl border backdrop-blur-sm shadow-lg p-6 ${
              theme === 'dark' 
                ? 'bg-gray-800/50 border-gray-700/50 shadow-black/20' 
                : 'bg-white/80 border-gray-300/50 shadow-gray-900/10'
            }`}>
              <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                <i className="fas fa-user-circle text-cinema-500"></i>
                Current Mood
              </h3>
              <div className="space-y-3">
                {(Object.keys(emotions) as (keyof EmotionScores)[]).map(emotion => {
                  const info = emotionInfo[emotion];
                  if (emotions[emotion] < 5) return null;
                  return (
                    <div key={emotion} className="flex items-center justify-between">
                      <span className={`text-sm flex items-center gap-2 ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        <i className={`${info.icon} text-${info.color}-500`}></i>
                        {info.label}
                      </span>
                      <span className={`text-sm font-mono font-bold ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {emotions[emotion]}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Genre Filter */}
            <div className={`rounded-2xl border backdrop-blur-sm shadow-lg p-6 ${
              theme === 'dark' 
                ? 'bg-gray-800/50 border-gray-700/50 shadow-black/20' 
                : 'bg-white/80 border-gray-300/50 shadow-gray-900/10'
            }`}>
              <button
                onClick={() => setIsGenreFilterOpen(!isGenreFilterOpen)}
                className={`w-full text-lg font-bold mb-4 flex items-center justify-between ${
                  theme === 'dark' ? 'text-white hover:text-cinema-300' : 'text-gray-900 hover:text-cinema-600'
                }`}
              >
                <div className="flex items-center gap-2">
                  <i className="fas fa-tags text-green-500"></i>
                  Genres ({selectedGenres.length} selected)
                </div>
                <i className={`fas fa-chevron-${isGenreFilterOpen ? 'up' : 'down'} text-sm`}></i>
              </button>
              {isGenreFilterOpen && (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                {genres.map(genre => (
                  <label key={genre.id} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedGenres.includes(genre.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedGenres(prev => [...prev, genre.id]);
                        } else {
                          setSelectedGenres(prev => prev.filter(id => id !== genre.id));
                        }
                      }}
                      className="w-4 h-4 text-cinema-600 rounded focus:ring-cinema-500"
                    />
                    <span className={`text-sm ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {genre.name}
                    </span>
                  </label>
                ))}
                </div>
              )}
            </div>
            
            {/* Year Range Filter */}
            <div className={`rounded-2xl border backdrop-blur-sm shadow-lg p-6 ${
              theme === 'dark' 
                ? 'bg-gray-800/50 border-gray-700/50 shadow-black/20' 
                : 'bg-white/80 border-gray-300/50 shadow-gray-900/10'
            }`}>
              <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                <i className="fas fa-calendar text-orange-500"></i>
                Release Year
              </h3>
              <div className="space-y-4">
                <div>
                  <label className={`text-sm font-medium ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    From: {yearRange.min}
                  </label>
                  <input
                    type="range"
                    min="1900"
                    max={new Date().getFullYear()}
                    value={yearRange.min}
                    onChange={(e) => setYearRange(prev => ({ ...prev, min: parseInt(e.target.value) }))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                  />
                </div>
                <div>
                  <label className={`text-sm font-medium ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    To: {yearRange.max}
                  </label>
                  <input
                    type="range"
                    min="1900"
                    max={new Date().getFullYear()}
                    value={yearRange.max}
                    onChange={(e) => setYearRange(prev => ({ ...prev, max: parseInt(e.target.value) }))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                  />
                </div>
              </div>
            </div>
            
            {/* Rating Filter */}
            <div className={`rounded-2xl border backdrop-blur-sm shadow-lg p-6 ${
              theme === 'dark' 
                ? 'bg-gray-800/50 border-gray-700/50 shadow-black/20' 
                : 'bg-white/80 border-gray-300/50 shadow-gray-900/10'
            }`}>
              <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                <i className="fas fa-star text-yellow-500"></i>
                Rating Range
              </h3>
              <div className="space-y-4">
                <div>
                  <label className={`text-sm font-medium ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Minimum: {ratingRange.min}/10
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.1"
                    value={ratingRange.min}
                    onChange={(e) => setRatingRange(prev => ({ ...prev, min: parseFloat(e.target.value) }))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                  />
                </div>
              </div>
            </div>
            
            {/* Sort By */}
            <div className={`rounded-2xl border backdrop-blur-sm shadow-lg p-6 ${
              theme === 'dark' 
                ? 'bg-gray-800/50 border-gray-700/50 shadow-black/20' 
                : 'bg-white/80 border-gray-300/50 shadow-gray-900/10'
            }`}>
              <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                <i className="fas fa-sort text-red-500"></i>
                Sort By
              </h3>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'popularity' | 'rating' | 'release_date' | 'emotion_match')}
                className={`w-full px-4 py-3 rounded-xl border transition-colors ${
                  theme === 'dark'
                    ? 'bg-gray-700/50 border-gray-600 text-white focus:border-purple-500'
                    : 'bg-white border-gray-300 text-gray-900 focus:border-purple-500'
                } focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
              >
                <option value="emotion_match">Emotion Match</option>
                <option value="popularity">Popularity</option>
                <option value="rating">Rating</option>
                <option value="release_date">Release Date</option>
              </select>
            </div>
            
            {/* Reset Filters */}
            <button
              onClick={resetFilters}
              className={`w-full px-4 py-3 rounded-xl font-medium transition-all duration-200 hover:scale-105 ${
                theme === 'dark'
                  ? 'bg-gray-700/50 text-white hover:bg-gray-600/50'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              <i className="fas fa-undo mr-2"></i>
              Reset All Filters
            </button>
          </div>
          
          {/* Main Content */}
          <div className="flex-1 space-y-6">
            
            {/* Algorithm Insights */}
            <div className={`rounded-2xl border backdrop-blur-sm shadow-lg p-6 ${
              theme === 'dark' 
                ? 'bg-gray-800/50 border-gray-700/50 shadow-black/20' 
                : 'bg-white/80 border-gray-300/50 shadow-gray-900/10'
            }`}>
              <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                <i className="fas fa-cogs text-blue-500"></i>
                Algorithm Insights
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className={`text-sm font-semibold mb-2 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Matching Genres:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {algorithmInsights.matchingGenres.map(genre => (
                      <span key={genre} className={`px-2 py-1 rounded-lg text-xs font-medium ${
                        theme === 'dark' 
                          ? 'bg-blue-500/20 text-blue-300' 
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {genre}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className={`text-sm font-semibold mb-2 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Top Emotions:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(algorithmInsights.emotionProfile)
                      .filter(([, value]) => value > 5)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 3)
                      .map(([emotion, value]) => (
                        <span key={emotion} className={`px-2 py-1 rounded-lg text-xs font-medium ${
                          theme === 'dark' 
                            ? 'bg-cinema-500/20 text-cinema-300' 
                            : 'bg-cinema-100 text-cinema-700'
                        }`}>
                          {emotion} ({value}%)
                        </span>
                      ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Movie Grid */}
            <div className={`rounded-2xl border backdrop-blur-sm shadow-lg p-6 ${
              theme === 'dark' 
                ? 'bg-gray-800/50 border-gray-700/50 shadow-black/20' 
                : 'bg-white/80 border-gray-300/50 shadow-gray-900/10'
            }`}>
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-xl font-bold flex items-center gap-2 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  <i className="fas fa-magic text-purple-500"></i>
                  Recommended Movies ({filteredMovies.length} found)
                </h3>
                {loading && (
                  <div className="flex items-center gap-2">
                    <LoadingSpinner />
                    <span className={`text-sm ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Updating...
                    </span>
                  </div>
                )}
              </div>
              
              {filteredMovies.length > 0 ? (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {currentMovies.map((movie) => (
                        <div 
                          key={movie.id} 
                          onClick={() => handleMovieClick(movie.id)}
                          className={`rounded-xl border backdrop-blur-sm shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group cursor-pointer ${
                            theme === 'dark' 
                              ? 'bg-gray-800/30 border-gray-700/30 hover:bg-gray-800/50' 
                              : 'bg-white/60 border-gray-300/30 hover:bg-white/80'
                          }`}>
                          <div className="aspect-[2/3] rounded-t-xl overflow-hidden relative">
                            <img
                              src={movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '/placeholder-movie.jpg'}
                              alt={movie.title}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            {movie.emotionScore && (
                              <div className="absolute top-2 right-2 bg-purple-600/90 text-white text-xs px-2 py-1 rounded-full font-bold">
                                {Math.round((movie.emotionScore || 0) * 100)}%
                              </div>
                            )}
                          </div>
                          <div className="p-3">
                            <h4 className={`text-sm font-semibold mb-1 line-clamp-2 ${
                              theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>
                              {movie.title}
                            </h4>
                            <p className={`text-xs mb-2 ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              {movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A'}
                            </p>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center">
                                <i className="fas fa-star text-yellow-400 text-xs mr-1"></i>
                                <span className={`text-xs ${
                                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                }`}>
                                  {movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                {isInWatchlist(movie.id) && (
                                  <i className="fas fa-bookmark text-green-500 text-xs"></i>
                                )}
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {Math.round(movie.popularity)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                    ))}
                  </div>

                  
                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-8">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                          currentPage === 1
                            ? theme === 'dark' 
                              ? 'bg-gray-800/50 text-gray-600 cursor-not-allowed' 
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : theme === 'dark'
                              ? 'bg-gray-700/50 text-white hover:bg-gray-600/50'
                              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                        }`}
                      >
                        <i className="fas fa-chevron-left mr-2"></i>
                        Previous
                      </button>
                      
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`w-10 h-10 rounded-xl text-sm font-medium transition-all duration-200 ${
                                currentPage === pageNum
                                  ? theme === 'dark'
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-purple-600 text-white'
                                  : theme === 'dark'
                                    ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>
                      
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                          currentPage === totalPages
                            ? theme === 'dark' 
                              ? 'bg-gray-800/50 text-gray-600 cursor-not-allowed' 
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : theme === 'dark'
                              ? 'bg-gray-700/50 text-white hover:bg-gray-600/50'
                              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                        }`}
                      >
                        Next
                        <i className="fas fa-chevron-right ml-2"></i>
                      </button>
                    </div>
                  )}
                  
                  <div className={`text-center mt-4 text-sm ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Showing {startIndex + 1}-{Math.min(endIndex, filteredMovies.length)} of {filteredMovies.length} movies
                  </div>
                </>
              ) : !loading ? (
                <div className="text-center py-16">
                  <i className={`fas fa-film text-5xl mb-4 ${
                    theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
                  }`}></i>
                  <h4 className={`text-lg font-semibold mb-2 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    No movies found
                  </h4>
                  <p className={`${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Try adjusting your filters or emotion profile
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
      
      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode="register"
      />
    </div>
  );
};

export default Recommendations;
