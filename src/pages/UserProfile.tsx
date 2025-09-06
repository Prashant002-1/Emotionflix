/**
 * User Profile Page Component
 * 
 * Comprehensive user profile management page with multiple tabs:
 * - Profile: Basic user information and stats
 * - Watchlist: User's saved movies to watch later
 * - Watch History: Previously watched movies with emotion data
 * - Emotion Analytics: Personalized emotion patterns and insights
 * - Settings: Account settings and password management
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
import { useEmotion } from '../contexts/EmotionContext';
import { LoadingSpinner } from '../components/common';
import EmotionDisplay from '../components/features/emotion/EmotionDisplay';
import { personalizedEmotionMappingService, PersonalizedMapping } from '../services/personalizedEmotionMapping';
import { GetGenres } from '../services/tmdbApi';
import { Genre } from '../types/movie';
import { convertToEmotionScores } from '../services/userMoviesService';
import { authService, ChangePasswordData } from '../services/authService';

/**
 * UserProfile page component with tabbed interface for user account management.
 * Handles profile viewing, watchlist management, emotion analytics, and settings.
 */
const UserProfile: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useUser();
  const { watchHistory, watchlist, removeFromWatchlist, removeFromWatchHistory } = useEmotion();
  const [searchParams] = useSearchParams();
  
  const [activeTab, setActiveTab] = useState<'profile' | 'stats' | 'watchlist' | 'emotions' | 'settings'>('profile');
  const [watchHistoryPage, setWatchHistoryPage] = useState(1);
  const [watchlistPage, setWatchlistPage] = useState(1);
  
  const ITEMS_PER_PAGE = 12;

  // Handle tab query parameter
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['profile', 'stats', 'watchlist', 'emotions', 'settings'].includes(tabParam)) {
      setActiveTab(tabParam as 'profile' | 'stats' | 'watchlist' | 'emotions' | 'settings');
    }
  }, [searchParams]);

  // Reset pagination when switching tabs
  useEffect(() => {
    if (activeTab === 'stats') {
      setWatchHistoryPage(1);
    } else if (activeTab === 'watchlist') {
      setWatchlistPage(1);
    }
  }, [activeTab]);

  // Pagination calculations for watch history
  const watchHistoryTotalPages = Math.ceil(watchHistory.length / ITEMS_PER_PAGE);
  const watchHistoryStartIndex = (watchHistoryPage - 1) * ITEMS_PER_PAGE;
  const watchHistoryEndIndex = watchHistoryStartIndex + ITEMS_PER_PAGE;
  const paginatedWatchHistory = watchHistory.slice(watchHistoryStartIndex, watchHistoryEndIndex);

  // Pagination calculations for watchlist
  const watchlistTotalPages = Math.ceil(watchlist.length / ITEMS_PER_PAGE);
  const watchlistStartIndex = (watchlistPage - 1) * ITEMS_PER_PAGE;
  const watchlistEndIndex = watchlistStartIndex + ITEMS_PER_PAGE;
  const paginatedWatchlist = watchlist.slice(watchlistStartIndex, watchlistEndIndex);

  // ProtectedRoute ensures user is not null, but TypeScript doesn't know that
  if (!user) return null;

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-24 h-24 bg-cinema-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-cinema">
            <i className="fas fa-user text-white text-3xl"></i>
          </div>
          <h1 className={`text-4xl md:text-5xl font-bold tracking-tight mb-4 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            {user.displayName}
          </h1>
          <p className={`text-xl font-medium ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            {user.email}
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className={`flex rounded-2xl p-2 ${
            theme === 'dark' ? 'bg-slate-800/50' : 'bg-gray-100'
          }`}>
            {[
              { id: 'profile', label: 'Profile', icon: 'fa-user' },
              { id: 'stats', label: 'Watch History', icon: 'fa-history' },
              { id: 'watchlist', label: 'Watchlist', icon: 'fa-bookmark' },
              { id: 'emotions', label: 'Emotions', icon: 'fa-heart' },
              { id: 'settings', label: 'Settings', icon: 'fa-cog' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'profile' | 'stats' | 'watchlist' | 'emotions' | 'settings')}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-cinema-600 text-white shadow-cinema'
                    : 'text-charcoal-600 hover:text-charcoal-900 hover:bg-charcoal-100/60'
                }`}
              >
                <i className={`fas ${tab.icon}`}></i>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className={`rounded-2xl border backdrop-blur-sm shadow-lg p-8 ${
          theme === 'dark' 
            ? 'bg-slate-800/30 border-slate-700/50 shadow-black/20' 
            : 'bg-white/60 border-gray-200/50 shadow-gray-900/5'
        }`}>
          {activeTab === 'profile' && (
            <div className="space-y-8">
              <h2 className={`text-2xl font-bold mb-6 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Profile Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className={`p-6 rounded-xl ${
                  theme === 'dark' ? 'bg-slate-700/50' : 'bg-gray-50'
                }`}>
                  <h3 className={`text-lg font-semibold mb-4 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    Account Details
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <span className={`text-sm font-medium ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        Display Name:
                      </span>
                      <p className={`text-lg ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {user.displayName}
                      </p>
                    </div>
                    <div>
                      <span className={`text-sm font-medium ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        Username:
                      </span>
                      <p className={`text-lg ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {user.username}
                      </p>
                    </div>
                    <div>
                      <span className={`text-sm font-medium ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        Email:
                      </span>
                      <p className={`text-lg ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {user.email}
                      </p>
                    </div>
                  </div>
                </div>

                <div className={`p-6 rounded-xl ${
                  theme === 'dark' ? 'bg-slate-700/50' : 'bg-gray-50'
                }`}>
                  <h3 className={`text-lg font-semibold mb-4 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    Quick Stats
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className={`font-medium ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Movies Watched
                      </span>
                      <span className="text-2xl font-bold text-gradient-cinema">
                        {user.stats.moviesWatched}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={`font-medium ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Emotions Logged
                      </span>
                      <span className="text-2xl font-bold text-gradient-film">
                        {user.stats.emotionsLogged}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={`font-medium ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Favorite Emotion
                      </span>
                      <span className="text-2xl font-bold text-gradient-cinema">
                        {(() => {
                          const emotionIcons = {
                            happy: 'fas fa-smile',
                            sad: 'fas fa-sad-tear',
                            angry: 'fas fa-angry',
                            fearful: 'fas fa-surprise',
                            surprised: 'fas fa-surprise',
                            disgusted: 'fas fa-frown',
                            neutral: 'fas fa-meh'
                          };
                          const iconClass = emotionIcons[user.stats.favoriteEmotion as keyof typeof emotionIcons] || 'fas fa-meh';
                          return <i className={iconClass}></i>;
                        })()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className={`text-2xl font-bold ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  Watch History
                </h2>
                {watchHistory.length > 0 && (
                  <div className={`text-sm ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {watchHistory.length} total movies
                  </div>
                )}
              </div>
              
              {paginatedWatchHistory.length > 0 ? (
                <>
                  <div className="space-y-4">
                    {paginatedWatchHistory.map((movie) => (
                      <div key={`${movie.movie_id}-${movie.created_at}`} className={`p-4 rounded-xl border ${
                        theme === 'dark' 
                          ? 'bg-slate-700/50 border-slate-600' 
                          : 'bg-gray-50 border-gray-200'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <img
                              src={movie.poster_path ? `https://image.tmdb.org/t/p/w92${movie.poster_path}` : '/placeholder-movie.png'}
                              alt={movie.title}
                              className="w-12 h-18 object-cover rounded-lg"
                            />
                            <div>
                              <h3 className={`font-semibold ${
                                theme === 'dark' ? 'text-white' : 'text-gray-900'
                              }`}>
                                {movie.title}
                              </h3>
                              <p className={`text-sm ${
                                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                              }`}>
                                Watched on {new Date(movie.created_at).toLocaleDateString()}
                              </p>
                              {(() => {
                                const emotions = convertToEmotionScores(movie);
                                return emotions && (
                                  <div className="mt-2">
                                    <EmotionDisplay emotions={emotions} />
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <i className="fas fa-star text-yellow-400"></i>
                              <span className={`font-semibold ${
                                theme === 'dark' ? 'text-white' : 'text-gray-900'
                              }`}>
                                {movie.vote_average.toFixed(1)}
                              </span>
                            </div>
                            <button
                              onClick={() => removeFromWatchHistory(movie.movie_id)}
                              className="text-red-500 hover:text-red-700 transition-colors p-1"
                              title="Remove from watch history"
                            >
                              <i className="fas fa-trash text-sm"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Watch History Pagination */}
                  {watchHistoryTotalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-8">
                      <button
                        onClick={() => setWatchHistoryPage(prev => Math.max(1, prev - 1))}
                        disabled={watchHistoryPage === 1}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          watchHistoryPage === 1
                            ? theme === 'dark'
                              ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : theme === 'dark'
                              ? 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        <i className="fas fa-chevron-left mr-2"></i>
                        Previous
                      </button>
                      
                      <div className="flex items-center gap-2">
                        {Array.from({ length: watchHistoryTotalPages }, (_, i) => {
                          const page = i + 1;
                          const isCurrentPage = page === watchHistoryPage;
                          const isNearCurrent = Math.abs(page - watchHistoryPage) <= 2;
                          const isFirstOrLast = page === 1 || page === watchHistoryTotalPages;
                          
                          if (!isNearCurrent && !isFirstOrLast) {
                            if (page === 2 || page === watchHistoryTotalPages - 1) {
                              return <span key={page} className="px-2">...</span>;
                            }
                            return null;
                          }
                          
                          return (
                            <button
                              key={page}
                              onClick={() => setWatchHistoryPage(page)}
                              className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                                isCurrentPage
                                  ? 'bg-cinema-600 text-white'
                                  : theme === 'dark'
                                    ? 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              }`}
                            >
                              {page}
                            </button>
                          );
                        })}
                      </div>
                      
                      <button
                        onClick={() => setWatchHistoryPage(prev => Math.min(watchHistoryTotalPages, prev + 1))}
                        disabled={watchHistoryPage === watchHistoryTotalPages}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          watchHistoryPage === watchHistoryTotalPages
                            ? theme === 'dark'
                              ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : theme === 'dark'
                              ? 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        Next
                        <i className="fas fa-chevron-right ml-2"></i>
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <i className="fas fa-film text-6xl text-gray-400 mb-4"></i>
                  <p className={`text-lg ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    No movies watched yet
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'watchlist' && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className={`text-2xl font-bold ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  My Watchlist
                </h2>
                {watchlist.length > 0 && (
                  <div className={`text-sm ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {watchlist.length} total movies
                  </div>
                )}
              </div>
              
              {paginatedWatchlist.length > 0 ? (
                <>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {paginatedWatchlist.map((movie) => (
                      <div key={movie.movie_id} className={`p-4 rounded-xl border transition-all hover:shadow-lg ${
                        theme === 'dark' 
                          ? 'bg-slate-700/50 border-slate-600 hover:border-slate-500' 
                          : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                      }`}>
                        <div className="flex items-start gap-4">
                          <img
                            src={movie.poster_path ? `https://image.tmdb.org/t/p/w154${movie.poster_path}` : '/placeholder-movie.png'}
                            alt={movie.title}
                            className="w-16 h-24 object-cover rounded-lg"
                          />
                          <div className="flex-1">
                            <h3 className={`font-semibold mb-2 ${
                              theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>
                              {movie.title}
                            </h3>
                            <div className="flex items-center gap-2 mb-2">
                              <i className="fas fa-star text-yellow-400 text-sm"></i>
                              <span className={`text-sm ${
                                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                              }`}>
                                {movie.vote_average.toFixed(1)}
                              </span>
                              <span className={`text-sm ${
                                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                              }`}>
                                • {new Date(movie.release_date).getFullYear()}
                              </span>
                            </div>
                            <div className="flex gap-2 mt-3">
                              <button
                                onClick={() => window.location.href = `/movie/${movie.movie_id}`}
                                className="text-xs px-3 py-1 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors"
                              >
                                View Details
                              </button>
                              <button
                                onClick={() => window.location.href = `/log?movieId=${movie.movie_id}`}
                                className="text-xs px-3 py-1 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors"
                              >
                                Log Emotions
                              </button>
                              <button
                                onClick={() => removeFromWatchlist(movie.movie_id)}
                                className="text-xs px-3 py-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Watchlist Pagination */}
                  {watchlistTotalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-8">
                      <button
                        onClick={() => setWatchlistPage(prev => Math.max(1, prev - 1))}
                        disabled={watchlistPage === 1}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          watchlistPage === 1
                            ? theme === 'dark'
                              ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : theme === 'dark'
                              ? 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        <i className="fas fa-chevron-left mr-2"></i>
                        Previous
                      </button>
                      
                      <div className="flex items-center gap-2">
                        {Array.from({ length: watchlistTotalPages }, (_, i) => {
                          const page = i + 1;
                          const isCurrentPage = page === watchlistPage;
                          const isNearCurrent = Math.abs(page - watchlistPage) <= 2;
                          const isFirstOrLast = page === 1 || page === watchlistTotalPages;
                          
                          if (!isNearCurrent && !isFirstOrLast) {
                            if (page === 2 || page === watchlistTotalPages - 1) {
                              return <span key={page} className="px-2">...</span>;
                            }
                            return null;
                          }
                          
                          return (
                            <button
                              key={page}
                              onClick={() => setWatchlistPage(page)}
                              className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                                isCurrentPage
                                  ? 'bg-cinema-600 text-white'
                                  : theme === 'dark'
                                    ? 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              }`}
                            >
                              {page}
                            </button>
                          );
                        })}
                      </div>
                      
                      <button
                        onClick={() => setWatchlistPage(prev => Math.min(watchlistTotalPages, prev + 1))}
                        disabled={watchlistPage === watchlistTotalPages}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          watchlistPage === watchlistTotalPages
                            ? theme === 'dark'
                              ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : theme === 'dark'
                              ? 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        Next
                        <i className="fas fa-chevron-right ml-2"></i>
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <i className="fas fa-bookmark text-6xl text-gray-400 mb-4"></i>
                  <p className={`text-lg mb-2 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Your watchlist is empty
                  </p>
                  <p className={`text-sm ${
                    theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                  }`}>
                    Browse movies and add them to your watchlist to keep track of what you want to watch
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'emotions' && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className={`text-2xl font-bold ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  Emotional Profile
                </h2>
                <div className={`px-3 py-1 rounded-full text-sm ${
                  theme === 'dark' 
                    ? 'bg-blue-900/30 text-blue-300' 
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  Personalized & Dynamic
                </div>
              </div>

              <EmotionalProfileDisplay theme={theme} user={user} />
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-8">
              <h2 className={`text-2xl font-bold mb-6 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Account Settings
              </h2>
              
              <PasswordChangeForm theme={theme} />
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

// Enhanced Emotional Profile Display Component
const EmotionalProfileDisplay: React.FC<{ theme: string; user: any }> = ({ theme, user }) => {
  const [emotionalProfile, setEmotionalProfile] = useState<PersonalizedMapping | null>(null);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadEmotionalProfile = async (isRefresh = false) => {
    try {
      setError(null);
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const userId = user?.id?.toString() || '';
      const [profile, genreResponse] = await Promise.all([
        personalizedEmotionMappingService.getUserEmotionGenreMappings(userId),
        GetGenres()
      ]);
      setEmotionalProfile(profile);
      setGenres(genreResponse.genres);
    } catch (error) {
      console.error('Error loading emotional profile:', error);
      setError('Failed to load emotional profile. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadEmotionalProfile();
  }, [user?.id]);

  const handleRefresh = async () => {
    await loadEmotionalProfile(true);
  };

  const getGenreName = (genreId: number): string => {
    const genre = genres.find(g => g.id === genreId);
    return genre ? genre.name : `Genre ${genreId}`;
  };

  const getStrengthLabel = (weight: number): string => {
    if (weight > 0.8) return 'Very Strong';
    if (weight > 0.6) return 'Strong';
    if (weight > 0.4) return 'Moderate';
    if (weight > 0.2) return 'Weak';
    return 'Very Weak';
  };

  const getStrengthColor = (weight: number): string => {
    if (weight > 0.8) return 'text-green-600';
    if (weight > 0.6) return 'text-green-500';
    if (weight > 0.4) return 'text-yellow-500';
    if (weight > 0.2) return 'text-orange-500';
    return 'text-gray-500';
  };

  const getStrengthBgColor = (weight: number): string => {
    if (weight > 0.8) return 'bg-green-500';
    if (weight > 0.6) return 'bg-green-400';
    if (weight > 0.4) return 'bg-yellow-400';
    if (weight > 0.2) return 'bg-orange-400';
    return 'bg-gray-400';
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner message="Loading your emotional profile..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className={`w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center`}>
          <i className="fas fa-exclamation-triangle text-white text-3xl"></i>
        </div>
        <h3 className={`text-xl font-semibold mb-3 ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
          Error Loading Profile
        </h3>
        <p className={`text-lg mb-6 ${
          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
        }`}>
          {error}
        </p>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
            theme === 'dark'
              ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-800'
              : 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-800'
          }`}
        >
          {refreshing ? (
            <>
              <i className="fas fa-spinner fa-spin mr-2"></i>
              Refreshing...
            </>
          ) : (
            <>
              <i className="fas fa-redo mr-2"></i>
              Try Again
            </>
          )}
        </button>
      </div>
    );
  }

  const emotionInfo = {
    neutral: { 
      icon: 'fas fa-meh', 
      color: 'text-gray-500', 
      label: 'Neutral',
      description: 'Balanced, calm emotional responses',
      bgGradient: 'from-gray-400 to-gray-600'
    },
    happy: { 
      icon: 'fas fa-smile', 
      color: 'text-yellow-500', 
      label: 'Happy',
      description: 'Joyful, uplifting emotional responses',
      bgGradient: 'from-yellow-400 to-orange-500'
    },
    sad: { 
      icon: 'fas fa-frown', 
      color: 'text-blue-500', 
      label: 'Sad',
      description: 'Melancholic, emotional responses',
      bgGradient: 'from-blue-400 to-indigo-600'
    },
    angry: { 
      icon: 'fas fa-angry', 
      color: 'text-red-500', 
      label: 'Angry',
      description: 'Intense, powerful emotional responses',
      bgGradient: 'from-red-500 to-red-700'
    },
    fearful: { 
      icon: 'fas fa-grimace', 
      color: 'text-purple-500', 
      label: 'Fearful',
      description: 'Anxious, suspenseful emotional responses',
      bgGradient: 'from-purple-500 to-gray-700'
    },
    disgusted: { 
      icon: 'fas fa-dizzy', 
      color: 'text-green-500', 
      label: 'Disgusted',
      description: 'Repulsed, intense emotional responses',
      bgGradient: 'from-green-500 to-teal-600'
    },
    surprised: { 
      icon: 'fas fa-surprise', 
      color: 'text-orange-500', 
      label: 'Surprised',
      description: 'Shocked, unexpected emotional responses',
      bgGradient: 'from-orange-400 to-red-500'
    }
  };

  if (!emotionalProfile || Object.keys(emotionalProfile).length === 0) {
    return (
      <div className="text-center py-12">
        <div className={`w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-cinema-500 to-film-600 flex items-center justify-center shadow-cinema`}>
          <i className="fas fa-brain text-white text-3xl"></i>
        </div>
        <h3 className={`text-xl font-semibold mb-3 ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
          Build Your Emotional Profile
        </h3>
        <p className={`text-lg mb-4 ${
          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
        }`}>
          Start logging movies to discover your emotional patterns
        </p>
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
          theme === 'dark' ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-700'
        }`}>
          <i className="fas fa-lightbulb text-sm"></i>
          <span className="text-sm">Your profile will update automatically</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Info Card */}
      <div className={`p-6 rounded-xl border ${
        theme === 'dark' ? 'bg-gradient-to-r from-cinema-900/20 to-film-900/20 border-cinema-500/30' : 'bg-gradient-to-r from-cinema-50 to-film-50 border-cinema-200'
      }`}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-full bg-gradient-to-br from-cinema-500 to-film-600 flex items-center justify-center flex-shrink-0 shadow-cinema`}>
              <i className="fas fa-brain text-white text-xl"></i>
            </div>
            <div className="flex-1">
              <h3 className={`text-lg font-semibold mb-2 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Your Emotional Profile
              </h3>
              <p className={`text-sm leading-relaxed ${
                theme === 'dark' ? 'text-blue-200' : 'text-blue-700'
              }`}>
                This profile shows how different movie genres affect your emotions. 
                The stronger the association, the more likely that genre is to evoke that emotion in you. 
                This data powers your personalized movie recommendations.
              </p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className={`p-2 rounded-lg transition-all duration-200 ${
              theme === 'dark'
                ? 'text-blue-300 hover:text-blue-200 hover:bg-blue-900/30 disabled:text-blue-600'
                : 'text-blue-600 hover:text-blue-700 hover:bg-blue-100 disabled:text-blue-400'
            }`}
            title="Refresh emotional profile"
          >
            <i className={`fas fa-redo text-lg ${refreshing ? 'fa-spin' : ''}`}></i>
          </button>
        </div>
      </div>

      {/* Emotion Cards */}
      {Object.entries(emotionalProfile).map(([emotion, genreWeights]) => {
        const info = emotionInfo[emotion as keyof typeof emotionInfo];
        if (!info || Object.keys(genreWeights).length === 0) return null;

        const isExpanded = selectedEmotion === emotion;
        const totalGenres = Object.entries(genreWeights).sort(([, a], [, b]) => b - a);
        const INITIAL_DISPLAY_COUNT = 6;
        const EXPANDED_DISPLAY_COUNT = 12;
        const sortedGenres = totalGenres.slice(0, isExpanded ? EXPANDED_DISPLAY_COUNT : INITIAL_DISPLAY_COUNT);

        return (
          <div key={emotion} className={`p-6 rounded-xl border transition-all duration-300 ${
            theme === 'dark' 
              ? 'bg-slate-700/50 border-slate-600 hover:border-slate-500' 
              : 'bg-gray-50 border-gray-200 hover:border-gray-300'
          }`}>
            {/* Emotion Header */}
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${info.bgGradient} flex items-center justify-center shadow-lg`}>
                <i className={`${info.icon} text-white text-2xl`}></i>
              </div>
              <div className="flex-1">
                <h3 className={`text-xl font-semibold ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {info.label}
                </h3>
                <p className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {info.description}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {totalGenres.length} total genres
                </span>
              </div>
            </div>
            
            {/* Genre Associations */}
            <div className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {sortedGenres.map(([genreId, weight]) => (
                  <div key={genreId} className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${
                    theme === 'dark' 
                      ? 'bg-slate-600/50 border-slate-500 hover:bg-slate-600/70' 
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm font-semibold ${
                        theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                      }`}>
                        {getGenreName(parseInt(genreId))}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${getStrengthColor(weight)}`}>
                          {getStrengthLabel(weight)}
                        </span>
                        <span className={`text-sm font-bold ${
                          weight > 0.7 ? 'text-green-600' : 
                          weight > 0.4 ? 'text-yellow-600' : 'text-gray-500'
                        }`}>
                          {Math.round(weight * 100)}%
                        </span>
                      </div>
                    </div>
                    <div className={`h-3 rounded-full overflow-hidden ${
                      theme === 'dark' ? 'bg-slate-700' : 'bg-gray-200'
                    }`}>
                      <div 
                        className={`h-full transition-all duration-500 ${getStrengthBgColor(weight)}`}
                        style={{ width: `${weight * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              
              {!isExpanded && totalGenres.length > INITIAL_DISPLAY_COUNT && (
                <div className="text-center mt-6">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedEmotion(emotion);
                    }}
                    className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-105 ${
                      theme === 'dark' 
                        ? 'bg-slate-600/70 text-slate-200 hover:bg-slate-600 border border-slate-500' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                    }`}
                  >
                    <i className="fas fa-plus text-sm"></i>
                    Show {Math.min(totalGenres.length - INITIAL_DISPLAY_COUNT, EXPANDED_DISPLAY_COUNT - INITIAL_DISPLAY_COUNT)} more genres
                  </button>
                </div>
              )}

              {isExpanded && totalGenres.length > INITIAL_DISPLAY_COUNT && (
                <div className="text-center mt-6">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedEmotion(null);
                    }}
                    className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-105 ${
                      theme === 'dark' 
                        ? 'bg-slate-600/70 text-slate-200 hover:bg-slate-600 border border-slate-500' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                    }`}
                  >
                    <i className="fas fa-minus text-sm"></i>
                    Show fewer genres
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Password Change Form Component
const PasswordChangeForm: React.FC<{ theme: string }> = ({ theme }) => {
  const [formData, setFormData] = useState<ChangePasswordData>({
    currentPassword: '',
    newPassword: ''
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (formData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'New password must be at least 6 characters long' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      await authService.changePassword(formData);
      setMessage({ type: 'success', text: 'Password changed successfully' });
      setFormData({ currentPassword: '', newPassword: '' });
      setConfirmPassword('');
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || 'Failed to change password';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ChangePasswordData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (message) setMessage(null);
  };

  return (
    <div className={`p-6 rounded-xl ${
      theme === 'dark' ? 'bg-slate-700/50' : 'bg-gray-50'
    }`}>
      <h3 className={`text-lg font-semibold mb-4 ${
        theme === 'dark' ? 'text-white' : 'text-gray-900'
      }`}>
        Change Password
      </h3>
      
      {message && (
        <div className={`p-4 rounded-lg mb-4 ${
          message.type === 'success' 
            ? theme === 'dark'
              ? 'bg-green-900/30 border border-green-500/30 text-green-300'
              : 'bg-green-50 border border-green-200 text-green-700'
            : theme === 'dark'
              ? 'bg-red-900/30 border border-red-500/30 text-red-300'
              : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={`block text-sm font-medium mb-2 ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Current Password
          </label>
          <input
            type="password"
            value={formData.currentPassword}
            onChange={(e) => handleInputChange('currentPassword', e.target.value)}
            className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-cinema-500 focus:border-transparent transition-all ${
              theme === 'dark'
                ? 'bg-slate-600 border-slate-500 text-white placeholder-gray-400'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            }`}
            placeholder="Enter current password"
            required
          />
        </div>

        <div>
          <label className={`block text-sm font-medium mb-2 ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
          }`}>
            New Password
          </label>
          <input
            type="password"
            value={formData.newPassword}
            onChange={(e) => handleInputChange('newPassword', e.target.value)}
            className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-cinema-500 focus:border-transparent transition-all ${
              theme === 'dark'
                ? 'bg-slate-600 border-slate-500 text-white placeholder-gray-400'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            }`}
            placeholder="Enter new password"
            required
          />
        </div>

        <div>
          <label className={`block text-sm font-medium mb-2 ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Confirm New Password
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-cinema-500 focus:border-transparent transition-all ${
              theme === 'dark'
                ? 'bg-slate-600 border-slate-500 text-white placeholder-gray-400'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            }`}
            placeholder="Confirm new password"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-cinema-600 text-white py-3 px-6 rounded-xl hover:bg-cinema-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
        >
          {loading ? 'Changing Password...' : 'Change Password'}
        </button>
      </form>
    </div>
  );
};

export default UserProfile;