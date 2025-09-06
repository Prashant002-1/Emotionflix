/**
 * MovieRow Component
 * 
 * Renders a horizontal scrollable row of movie cards with poster images,
 * ratings, and optional emotion displays. Used for displaying watch history,
 * recommendations, and other movie collections.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../../contexts/ThemeContext';
import { WatchedMovie } from '../../../types/emotion';
import EmotionDisplay from '../emotion/EmotionDisplay';

interface MovieRowProps {
  title: string;
  movies: WatchedMovie[];
  showEmotions?: boolean;
  onLogEmotion?: (movieId: number) => void;
  detailsPath?: string;
}

/**
 * MovieRow component that displays a horizontal row of movie cards.
 * @param title - Section title displayed above the movie row
 * @param movies - Array of movie objects to display
 * @param showEmotions - Whether to show emotion data for each movie
 * @param onLogEmotion - Callback function for logging emotions for a movie
 * @param detailsPath - Path for "view all" link in the section header
 */
const MovieRow: React.FC<MovieRowProps> = ({ 
  title, 
  movies, 
  showEmotions = false, 
  onLogEmotion,
  detailsPath = '#'
}) => {
  const { theme } = useTheme();

  return (
    <div className="mb-8">
      {title && (
        <div className="flex items-center justify-between mb-6 px-6">
          <Link 
            to={detailsPath}
            className={`text-2xl font-black flex items-center gap-3 transition-colors ${
              theme === 'dark' ? 'text-white hover:text-gray-300' : 'text-gray-900 hover:text-gray-700'
            }`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              theme === 'dark' ? 'bg-gray-700 text-gray-200' : 'bg-gray-600 text-white'
            }`}>
              <i className="fas fa-history text-sm"></i>
            </div>
            {title}
          </Link>
          <i className={`fas fa-arrow-right ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}></i>
        </div>
      )}

      {/* Movie Scroll Container */}
      <div className="relative">
        <div className="overflow-x-auto scrollbar-thin">
          <div className="flex gap-6 px-6 pb-6">
            {movies.map((movie) => (
              <div
                key={movie.movieId}
                className="flex-shrink-0 w-48 group"
              >
                {/* Movie Tile */}
                <div className={`rounded-2xl border backdrop-blur-sm shadow-lg overflow-hidden transition-all duration-300 group-hover:scale-[1.02] hover:shadow-xl hover:-translate-y-1 ${
                  theme === 'dark'
                    ? 'bg-gradient-to-br from-slate-800/40 via-gray-800/30 to-slate-900/40 border-slate-700/50 shadow-black/30 hover:border-slate-600 hover:from-slate-700/50 hover:to-slate-800/50'
                    : 'bg-gradient-to-br from-white/70 via-gray-50/60 to-gray-100/70 border-gray-200/50 shadow-gray-900/10 hover:border-gray-300 hover:from-gray-50/80 hover:to-gray-100/80'
                }`}>
                  {/* Poster Container */}
                  <Link to={`/movie/${movie.movieId}`} className="block relative">
                    <div className="aspect-[3/4] relative overflow-hidden bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 dark:from-gray-800 dark:via-slate-800 dark:to-gray-900">
                      <img
                        src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                        alt={movie.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                      />
                      {/* Elegant overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <div className="absolute bottom-4 left-4 right-4">
                          <div className="flex items-center gap-3 text-white">
                            <div className="w-12 h-12 bg-gradient-to-br from-white/25 to-white/15 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:from-white/35 group-hover:to-white/25 transition-all duration-300 shadow-lg">
                              <i className="fas fa-play text-lg"></i>
                            </div>
                            <div>
                              <div className="font-semibold text-sm">Watch Now</div>
                              <div className="text-xs text-white/80">Click to view details</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>

                  {/* Movie Info */}
                  <div className="p-6">
                    <Link to={`/movie/${movie.movieId}`}>
                      <h3 className={`font-bold text-lg mb-3 line-clamp-2 leading-tight transition-colors ${
                        theme === 'dark' ? 'text-white group-hover:text-purple-300' : 'text-gray-900 group-hover:text-purple-600'
                      }`}>
                        {movie.title}
                      </h3>
                    </Link>
                    
                    {/* Rating & Year */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-gradient-to-r from-yellow-500/15 to-amber-500/10 backdrop-blur-sm">
                          <i className="fas fa-star text-yellow-500 text-sm"></i>
                          <span className={`font-semibold text-sm ${theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'}`}>
                            {movie.vote_average.toFixed(1)}
                          </span>
                        </div>
                        <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          {new Date(movie.release_date).getFullYear()}
                        </span>
                      </div>
                    </div>

                    {/* Emotions Display */}
                    {showEmotions && (
                      <div className="mt-4">
                        <EmotionDisplay
                          emotions={movie.emotions || {
                            neutral: 0, happy: 0, sad: 0, angry: 0, fearful: 0, disgusted: 0, surprised: 0
                          }}
                          showLogButton={!movie.hasLoggedEmotion}
                          onLogEmotion={() => onLogEmotion?.(movie.movieId)}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieRow;