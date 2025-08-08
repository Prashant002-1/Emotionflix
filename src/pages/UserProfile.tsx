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

const UserProfile: React.FC = () => {
  const { theme } = useTheme();
  const { user, logout } = useUser();
  const { watchHistory, watchlist, removeFromWatchlist, removeFromWatchHistory } = useEmotion();
  const [searchParams] = useSearchParams();
  
  const [activeTab, setActiveTab] = useState<'profile' | 'stats' | 'watchlist' | 'emotions' | 'settings'>('profile');

  // Handle tab query parameter
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['profile', 'stats', 'watchlist', 'emotions', 'settings'].includes(tabParam)) {
      setActiveTab(tabParam as 'profile' | 'stats' | 'watchlist' | 'emotions' | 'settings');
    }
  }, [searchParams]);

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }


  const recentWatchHistory = watchHistory.slice(0, 10);

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
              <h2 className={`text-2xl font-bold mb-6 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Watch History
              </h2>
              
              {recentWatchHistory.length > 0 ? (
                <div className="space-y-4">
                  {recentWatchHistory.map((movie) => (
                    <div key={`${movie.movieId}-${movie.watchedAt}`} className={`p-4 rounded-xl border ${
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
                              Watched on {new Date(movie.watchedAt).toLocaleDateString()}
                            </p>
                            {movie.emotions && (
                              <div className="mt-2">
                                <EmotionDisplay emotions={movie.emotions} />
                              </div>
                            )}
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
                            onClick={() => removeFromWatchHistory(movie.movieId)}
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
              <h2 className={`text-2xl font-bold mb-6 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                My Watchlist
              </h2>
              
              {watchlist.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {watchlist.map((movie) => (
                    <div key={movie.movieId} className={`p-4 rounded-xl border transition-all hover:shadow-lg ${
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
                              onClick={() => window.location.href = `/movie/${movie.movieId}`}
                              className="text-xs px-3 py-1 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors"
                            >
                              View Details
                            </button>
                            <button
                              onClick={() => window.location.href = `/log?movieId=${movie.movieId}`}
                              className="text-xs px-3 py-1 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors"
                            >
                              Log Emotions
                            </button>
                            <button
                              onClick={() => removeFromWatchlist(movie.movieId)}
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
                Settings
              </h2>
              
              <div className="space-y-6">
                <div className={`p-6 rounded-xl ${
                  theme === 'dark' ? 'bg-slate-700/50' : 'bg-gray-50'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className={`text-lg font-semibold ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        Account Actions
                      </h3>
                      <p className={`text-sm ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        Manage your account
                      </p>
                    </div>
                    <button
                      onClick={logout}
                      className="px-4 py-2 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Emotional Profile Display Component
const EmotionalProfileDisplay: React.FC<{ theme: string; user: any }> = ({ theme, user }) => {
  const [emotionalProfile, setEmotionalProfile] = useState<PersonalizedMapping | null>(null);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEmotionalProfile = async () => {
      try {
        const userId = user?.id?.toString() || '';
        const [profile, genreResponse] = await Promise.all([
          personalizedEmotionMappingService.getUserEmotionGenreMappings(userId),
          GetGenres()
        ]);
        setEmotionalProfile(profile);
        setGenres(genreResponse.genres);
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };
    loadEmotionalProfile();
  }, [user?.id]);

  const getGenreName = (genreId: number): string => {
    const genre = genres.find(g => g.id === genreId);
    return genre ? genre.name : `Genre ${genreId}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  const emotionInfo = {
    neutral: { icon: 'fas fa-meh', color: 'text-gray-500', label: 'Neutral' },
    happy: { icon: 'fas fa-smile', color: 'text-yellow-500', label: 'Happy' },
    sad: { icon: 'fas fa-frown', color: 'text-blue-500', label: 'Sad' },
    angry: { icon: 'fas fa-angry', color: 'text-red-500', label: 'Angry' },
    fearful: { icon: 'fas fa-grimace', color: 'text-purple-500', label: 'Fearful' },
    disgusted: { icon: 'fas fa-dizzy', color: 'text-green-500', label: 'Disgusted' },
    surprised: { icon: 'fas fa-surprise', color: 'text-orange-500', label: 'Surprised' }
  };

  if (!emotionalProfile || Object.keys(emotionalProfile).length === 0) {
    return (
      <div className="text-center py-12">
        <i className="fas fa-brain text-6xl text-gray-400 mb-4"></i>
        <p className={`text-lg ${
          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
        }`}>
          Start logging movies to build your emotional profile
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className={`p-4 rounded-xl ${
        theme === 'dark' ? 'bg-blue-900/20 border border-blue-500/30' : 'bg-blue-50 border border-blue-200'
      }`}>
        <p className={`text-sm ${
          theme === 'dark' ? 'text-blue-300' : 'text-blue-700'
        }`}>
          Your emotional profile is dynamically updated based on your movie interactions. 
          The stronger the association between an emotion and genre, the better your recommendations become.
        </p>
      </div>

      {Object.entries(emotionalProfile).map(([emotion, genreWeights]) => {
        const info = emotionInfo[emotion as keyof typeof emotionInfo];
        if (!info || Object.keys(genreWeights).length === 0) return null;

        return (
          <div key={emotion} className={`p-6 rounded-xl border ${
            theme === 'dark' 
              ? 'bg-slate-700/50 border-slate-600' 
              : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center gap-3 mb-4">
              <i className={`${info.icon} text-2xl ${info.color}`}></i>
              <h3 className={`text-xl font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {info.label}
              </h3>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(genreWeights)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 6)
                .map(([genreId, weight]) => (
                  <div key={genreId} className={`p-3 rounded-lg ${
                    theme === 'dark' 
                      ? 'bg-slate-600/50' 
                      : 'bg-white border border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {getGenreName(parseInt(genreId))}
                      </span>
                      <span className={`text-sm font-bold ${
                        weight > 0.7 ? 'text-green-500' : 
                        weight > 0.4 ? 'text-yellow-500' : 'text-gray-500'
                      }`}>
                        {Math.round(weight * 100)}%
                      </span>
                    </div>
                    <div className={`mt-2 h-2 rounded-full overflow-hidden ${
                      theme === 'dark' ? 'bg-slate-700' : 'bg-gray-200'
                    }`}>
                      <div 
                        className={`h-full transition-all duration-300 ${
                          weight > 0.7 ? 'bg-green-500' : 
                          weight > 0.4 ? 'bg-yellow-500' : 'bg-gray-400'
                        }`}
                        style={{ width: `${weight * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default UserProfile;