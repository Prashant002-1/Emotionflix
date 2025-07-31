import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
import { useEmotion } from '../contexts/EmotionContext';
import AuthModal from '../components/auth/AuthModal';
const Home: React.FC = () => {
  const { theme } = useTheme();
  const { user, updateUserStats } = useUser();
  const { watchHistory } = useEmotion();
  const navigate = useNavigate();
  
  const [showAuthModal, setShowAuthModal] = useState(false);


  const handleExploreRecommendations = () => {
    navigate('/recommendations');
  };

  const handleMovieMatch = () => {
    navigate('/movie-match');
  };

  // Update user stats when user logs in
  useEffect(() => {
    if (user) {
      updateUserStats();
    }
  }, [user, updateUserStats]);

  // Update stats when watch history changes
  useEffect(() => {
    if (user && watchHistory.length > 0) {
      updateUserStats();
    }
  }, [user, watchHistory.length, updateUserStats]);

  const handleSignInPrompt = () => {
    setShowAuthModal(true);
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="relative mb-20">
          <div className="text-center max-w-5xl mx-auto">
            {user ? (
              <>
                <div className="flex items-center justify-center mb-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center shadow-xl shadow-purple-500/25">
                    <i className="fas fa-brain text-white text-2xl"></i>
                  </div>
                </div>
                <h1 className={`text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  Welcome back, <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{user.displayName}</span>
                </h1>
                <p className={`text-2xl md:text-3xl font-medium mb-8 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Your cinematic emotions guide the way
                </p>
              </>
            ) : (
              <>
                <div className="flex items-center justify-center mb-8">
                  <div className="w-24 h-24 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center shadow-xl shadow-purple-500/25 animate-pulse">
                    <i className="fas fa-heart text-white text-3xl"></i>
                  </div>
                </div>
                <h1 className={`text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  Cinema Meets <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Emotions</span>
                </h1>
                <p className={`text-2xl md:text-3xl font-medium mb-8 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Discover movies that resonate with your emotional state
                </p>
                <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                  <button
                    onClick={handleSignInPrompt}
                    className="px-10 py-5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg rounded-2xl transition-all duration-300 hover:shadow-2xl hover:scale-105 shadow-purple-500/25"
                  >
                    Start Your Emotional Journey
                  </button>
                  <button
                    onClick={handleMovieMatch}
                    className={`px-10 py-5 font-bold text-lg rounded-2xl transition-all duration-300 hover:scale-105 ${
                      theme === 'dark'
                        ? 'bg-gray-800/50 text-white border-2 border-gray-700 hover:bg-gray-700/50'
                        : 'bg-white/50 text-gray-900 border-2 border-gray-300 hover:bg-white/80'
                    }`}
                  >
                    Try Movie Match
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-12">
            <button
              onClick={handleExploreRecommendations}
              className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-xl transition-all duration-200 hover:shadow-xl hover:scale-105"
            >
              <i className="fas fa-compass"></i>
              Explore Recommendations
            </button>
            <button
              onClick={handleMovieMatch}
              className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl transition-all duration-200 hover:shadow-xl hover:scale-105"
            >
              <i className="fas fa-search"></i>
              Movie Match
            </button>
            {user && (
              <button
                onClick={() => navigate('/log')}
                className={`flex items-center gap-3 px-6 py-4 font-semibold rounded-xl transition-all duration-200 hover:scale-105 ${
                  theme === 'dark'
                    ? 'bg-gray-800/70 text-white border border-gray-700 hover:bg-gray-700/70'
                    : 'bg-white/70 text-gray-900 border border-gray-300 hover:bg-white/90'
                }`}
              >
                <i className="fas fa-plus-circle"></i>
                Log Movie Emotions
              </button>
            )}
          </div>
        </div>

        {/* Quick Stats for Users */}
        {user && (
          <div className="mb-16">
            <div className="text-center mb-8">
              <h2 className={`text-3xl font-bold mb-2 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Your Emotional Journey
              </h2>
              <p className={`text-lg ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Track your cinematic exploration and emotional discoveries
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className={`p-8 rounded-2xl border backdrop-blur-sm shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-2 group ${
                theme === 'dark' 
                  ? 'bg-gradient-to-br from-purple-900/30 to-purple-800/20 border-purple-700/30' 
                  : 'bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200/50'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-purple-700 rounded-full flex items-center justify-center">
                    <i className="fas fa-film text-white"></i>
                  </div>
                  <div className={`text-4xl font-bold ${
                    theme === 'dark' ? 'text-purple-300' : 'text-purple-600'
                  }`}>{user.stats.moviesWatched || 0}</div>
                </div>
                <h3 className={`text-lg font-semibold mb-2 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>Movies Experienced</h3>
                <p className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>Films you've watched and logged emotions for</p>
              </div>
              <div className={`p-8 rounded-2xl border backdrop-blur-sm shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-2 group ${
                theme === 'dark' 
                  ? 'bg-gradient-to-br from-pink-900/30 to-pink-800/20 border-pink-700/30' 
                  : 'bg-gradient-to-br from-pink-50 to-pink-100/50 border-pink-200/50'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-pink-600 to-pink-700 rounded-full flex items-center justify-center">
                    <i className="fas fa-brain text-white"></i>
                  </div>
                  <div className={`text-4xl font-bold ${
                    theme === 'dark' ? 'text-pink-300' : 'text-pink-600'
                  }`}>{user.stats.emotionsLogged || 0}</div>
                </div>
                <h3 className={`text-lg font-semibold mb-2 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>Emotions Captured</h3>
                <p className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>Emotional responses recorded and analyzed</p>
              </div>
              <div className={`p-8 rounded-2xl border backdrop-blur-sm shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-2 group ${
                theme === 'dark' 
                  ? 'bg-gradient-to-br from-green-900/30 to-green-800/20 border-green-700/30' 
                  : 'bg-gradient-to-br from-green-50 to-green-100/50 border-green-200/50'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-green-700 rounded-full flex items-center justify-center">
                    <i className="fas fa-heart text-white"></i>
                  </div>
                  <div className={`text-3xl ${
                    theme === 'dark' ? 'text-green-300' : 'text-green-600'
                  }`}>
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
                  </div>
                </div>
                <h3 className={`text-lg font-semibold mb-2 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>Favorite Emotion</h3>
                <p className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>The emotion you experience most in movies</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Sections */}
        <div className="space-y-20">
          {/* Recently Watched with Emotions - Only for users */}
          {user && watchHistory.length > 0 && (
            <section className="space-y-8">
              <div className="text-center mb-12">
                <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  Your Recent <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Emotional</span> Journey
                </h2>
                <p className={`text-lg max-w-2xl mx-auto ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Movies you've watched with the emotions they evoked
                </p>
              </div>
              <div className={`p-8 rounded-2xl border backdrop-blur-sm shadow-lg ${
                theme === 'dark' 
                  ? 'bg-gray-800/30 border-gray-700/50' 
                  : 'bg-white/60 border-gray-300/50'
              }`}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className={`text-xl font-semibold flex items-center gap-3 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    <i className="fas fa-history text-purple-500"></i>
                    Recent Watches
                  </h3>
                  <button 
                    onClick={() => navigate('/profile?tab=stats')}
                    className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200 hover:scale-105 ${
                      theme === 'dark' 
                        ? 'text-gray-400 hover:text-white hover:bg-gray-700/50' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'
                    }`}
                  >
                    View All History
                  </button>
                </div>
                <div className="grid gap-4">
                  {watchHistory.slice(0, 3).map((movie, index) => (
                    <div key={`${movie.movieId}-${index}`} className={`p-4 rounded-xl border transition-all duration-200 hover:shadow-md ${
                      theme === 'dark' 
                        ? 'bg-gray-700/30 border-gray-600/30 hover:bg-gray-700/50' 
                        : 'bg-gray-50/50 border-gray-200/50 hover:bg-white/80'
                    }`}>
                      <div className="flex items-center gap-4">
                        <img
                          src={movie.poster_path ? `https://image.tmdb.org/t/p/w154${movie.poster_path}` : '/placeholder-movie.png'}
                          alt={movie.title}
                          className="w-16 h-24 object-cover rounded-lg shadow-md"
                        />
                        <div className="flex-1">
                          <h4 className={`text-lg font-semibold mb-2 ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>
                            {movie.title}
                          </h4>
                          <p className={`text-sm mb-3 ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            Watched {new Date(movie.watchedAt).toLocaleDateString()}
                          </p>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                              <span className={`text-sm font-medium ${
                                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                              }`}>
                                ⭐ {movie.vote_average.toFixed(1)}
                              </span>
                            </div>
                            <button
                              onClick={() => navigate(`/movie/${movie.movieId}`)}
                              className="text-sm text-purple-500 hover:text-purple-400 font-medium transition-colors"
                            >
                              View Details →
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Your Emotional Profile Summary */}
          {user && (
            <section className="space-y-8">
              <div className="text-center mb-12">
                <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  Your Emotional <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Genre</span> Profile
                </h2>
                <p className={`text-lg max-w-2xl mx-auto ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  The movie genres that make you feel each emotion the most
                </p>
              </div>
              <div className={`p-8 rounded-2xl border backdrop-blur-sm shadow-lg ${
                theme === 'dark' 
                  ? 'bg-gradient-to-br from-purple-900/20 to-pink-900/10 border-purple-700/30' 
                  : 'bg-gradient-to-br from-purple-50/50 to-pink-50/30 border-purple-200/50'
              }`}>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                      { emotion: 'happy', label: 'Happiest', icon: 'fas fa-smile', color: 'from-yellow-400 to-orange-500', genre: 'Comedy' },
                      { emotion: 'sad', label: 'Most Emotional', icon: 'fas fa-sad-tear', color: 'from-blue-400 to-indigo-600', genre: 'Drama' },
                      { emotion: 'angry', label: 'Most Intense', icon: 'fas fa-angry', color: 'from-red-500 to-red-700', genre: 'Action' },
                      { emotion: 'fearful', label: 'Most Fearful', icon: 'fas fa-surprise', color: 'from-purple-500 to-gray-700', genre: 'Horror' },
                      { emotion: 'surprised', label: 'Most Surprised', icon: 'fas fa-surprise', color: 'from-green-400 to-teal-600', genre: 'Thriller' },
                      { emotion: 'neutral', label: 'Most Balanced', icon: 'fas fa-meh', color: 'from-gray-400 to-gray-600', genre: 'Documentary' }
                    ].map(({ emotion, label, icon, color, genre }) => (
                      <div key={emotion} className={`p-6 rounded-xl border transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${
                        theme === 'dark' 
                          ? 'bg-gray-800/50 border-gray-700/50' 
                          : 'bg-white/80 border-gray-200/50'
                      }`}>
                        <div className="text-center">
                          <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r ${color} flex items-center justify-center shadow-lg`}>
                            <i className={`${icon} text-white text-xl`}></i>
                          </div>
                          <h4 className={`text-lg font-semibold mb-2 ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>
                            {label}
                          </h4>
                          <p className={`text-2xl font-bold mb-1 ${
                            theme === 'dark' ? 'text-purple-300' : 'text-purple-600'
                          }`}>
                            {genre}
                          </p>
                          <p className={`text-sm ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            Most associated genre
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="text-center pt-6">
                    <button
                      onClick={() => navigate('/profile?tab=emotions')}
                      className={`px-8 py-4 rounded-xl font-semibold transition-all duration-200 hover:scale-105 shadow-lg ${
                        theme === 'dark'
                          ? 'bg-purple-700/50 text-purple-200 hover:bg-purple-600/50'
                          : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                      }`}
                    >
                      View All Emotional Mappings →
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Get Started Section for Non-Users */}
          {!user && (
            <section className={`p-12 rounded-2xl border backdrop-blur-sm shadow-lg text-center ${
              theme === 'dark' 
                ? 'bg-gradient-to-br from-purple-900/30 to-pink-900/20 border-purple-700/30' 
                : 'bg-gradient-to-br from-purple-50/50 to-pink-50/30 border-purple-200/50'
            }`}>
              <div className="max-w-2xl mx-auto">
                <div className="flex items-center justify-center mb-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center shadow-xl shadow-purple-500/25">
                    <i className="fas fa-brain text-white text-3xl"></i>
                  </div>
                </div>
                <h2 className={`text-3xl md:text-4xl font-bold mb-6 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  Ready to Begin Your <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Emotional Journey</span>?
                </h2>
                <p className={`text-lg mb-8 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Join EmotionFlix to unlock personalized recommendations, track your emotional responses to movies, and discover films that truly resonate with your feelings.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className={`p-6 rounded-xl border ${
                    theme === 'dark' 
                      ? 'bg-gray-800/30 border-gray-700/30' 
                      : 'bg-white/60 border-gray-200/50'
                  }`}>
                    <i className="fas fa-heart text-3xl text-purple-500 mb-4"></i>
                    <h4 className={`text-lg font-semibold mb-2 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>Log Emotions</h4>
                    <p className={`text-sm ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>Record how movies make you feel</p>
                  </div>
                  <div className={`p-6 rounded-xl border ${
                    theme === 'dark' 
                      ? 'bg-gray-800/30 border-gray-700/30' 
                      : 'bg-white/60 border-gray-200/50'
                  }`}>
                    <i className="fas fa-magic text-3xl text-pink-500 mb-4"></i>
                    <h4 className={`text-lg font-semibold mb-2 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>Get Personalized</h4>
                    <p className={`text-sm ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>AI learns your emotional patterns</p>
                  </div>
                  <div className={`p-6 rounded-xl border ${
                    theme === 'dark' 
                      ? 'bg-gray-800/30 border-gray-700/30' 
                      : 'bg-white/60 border-gray-200/50'
                  }`}>
                    <i className="fas fa-compass text-3xl text-blue-500 mb-4"></i>
                    <h4 className={`text-lg font-semibold mb-2 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>Discover Movies</h4>
                    <p className={`text-sm ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>Find films that match your mood</p>
                  </div>
                </div>
                <button
                  onClick={handleSignInPrompt}
                  className="px-10 py-5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg rounded-2xl transition-all duration-300 hover:shadow-2xl hover:scale-105 shadow-purple-500/25"
                >
                  Join EmotionFlix Now
                </button>
              </div>
            </section>
          )}
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

export default Home;