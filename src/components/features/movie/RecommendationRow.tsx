/**
 * RecommendationRow Component
 * 
 * Displays a horizontal scrollable row of recommended movies.
 * Used for various recommendation categories with customizable icons and titles.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../../contexts/ThemeContext';
import { Movie } from '../../../types/movie';

interface RecommendationRowProps {
  title: string;
  movies: Movie[];
  icon?: string;
}

/**
 * RecommendationRow component that displays a row of recommended movies.
 * @param title - Section title for the recommendation row
 * @param movies - Array of movie objects to display
 * @param icon - FontAwesome icon class for the section header
 */
const RecommendationRow: React.FC<RecommendationRowProps> = ({ 
  title, 
  movies,
  icon = 'fas fa-star'
}) => {
  const { theme } = useTheme();

  if (movies.length === 0) return null;

  return (
    <div className="mb-8">
      {/* Section Header */}
      <div className="flex items-center gap-2 mb-4 px-4">
        <i className={`${icon} ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}></i>
        <h2 className={`text-xl font-bold ${
          theme === 'dark' ? 'text-white' : 'text-gray-800'
        }`}>
          {title}
        </h2>
      </div>

      {/* Movie Scroll Container */}
      <div className="relative">
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex gap-4 px-4 pb-4">
            {movies.map((movie) => (
              <div
                key={movie.id}
                className="flex-shrink-0 w-48"
              >
                {/* Movie Card */}
                <Link to={`/movie/${movie.id}`}>
                  <div className={`rounded-xl border backdrop-blur-sm overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-lg group ${
                    theme === 'dark'
                      ? 'bg-gradient-to-br from-slate-800/25 via-gray-800/20 to-slate-900/25 border-gray-700/40 shadow-black/20 hover:border-slate-600/60'
                      : 'bg-gradient-to-br from-white/60 via-gray-50/50 to-gray-100/60 border-gray-300/50 shadow-gray-900/5 hover:border-gray-400/60'
                  }`}>
                    {/* Poster Container - Fixed Aspect Ratio */}
                    <div className="aspect-[2/3] relative overflow-hidden bg-gradient-to-br from-gray-200 via-gray-300 to-gray-400 dark:from-gray-800 dark:via-slate-800 dark:to-gray-900">
                      <img
                        src={`https://image.tmdb.org/t/p/w300${movie.poster_path}`}
                        alt={movie.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      {/* Subtle Overlay on Hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>
                    </div>

                    {/* Movie Info */}
                    <div className="p-3">
                      <h3 className={`font-semibold text-sm mb-1 line-clamp-2 ${
                        theme === 'dark' ? 'text-white' : 'text-gray-800'
                      }`}>
                        {movie.title}
                      </h3>
                      
                      {/* Rating & Year */}
                      <div className="flex items-center gap-2 text-xs">
                        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-yellow-500/15 to-amber-500/10 backdrop-blur-sm">
                          <i className="fas fa-star text-yellow-400 text-xs"></i>
                          <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
                            {movie.vote_average.toFixed(1)}
                          </span>
                        </div>
                        <span className={theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}>
                          • {new Date(movie.release_date).getFullYear()}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecommendationRow;