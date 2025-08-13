import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Movie } from '../types/movie';
import { LoadingSpinner } from '../components/common';
import { GetMovieDetails } from '../services/tmdbApi';
import { useTheme } from '../contexts/ThemeContext';
import { useEmotion } from '../contexts/EmotionContext';

const MovieDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  useTheme();
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useEmotion();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMovie = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const movieData = await GetMovieDetails(parseInt(id));
        setMovie(movieData);
      } catch (err) {
        setError('Failed to load movie details');
      } finally {
        setLoading(false);
      }
    };

    fetchMovie();
  }, [id]);

  const handleLogEmotions = () => {
    if (movie) {
      navigate(`/log?movieId=${movie.id}`);
    }
  };

  const handleWatchlistToggle = async () => {
    if (!movie) return;

    try {
      if (isInWatchlist(movie.id)) {
        await removeFromWatchlist(movie.id);
      } else {
        await addToWatchlist(movie);
      }
    } catch (error) {
      console.error('Error toggling watchlist:', error);
      alert('Failed to update watchlist. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="text-center py-12 px-6 bg-red-500/10 backdrop-blur-sm rounded-xl border border-red-500/20">
        <i className="fas fa-exclamation-circle text-red-400 text-5xl mx-auto mb-4 block"></i>
        <p className="text-red-300 text-xl mb-6">{error || 'Movie not found'}</p>
        <Link
          to="/"
          className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-semibold"
        >
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div
      className="relative min-h-[80vh] bg-cover bg-center bg-no-repeat p-6 md:p-12"
      style={{
        backgroundImage: `linear-gradient(to top, rgba(17, 7, 22, 1) 0%, rgba(17, 7, 22, 0.8) 50%, rgba(17, 7, 22, 1) 100%), url(https://image.tmdb.org/t/p/original${movie.backdrop_path})`,
      }}
    >
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 relative z-10">
        <div className="md:col-span-1">
          {movie.poster_path && (
            <img
              src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
              alt={`${movie.title} movie poster`}
              className="w-full rounded-2xl shadow-2xl shadow-purple-500/20 border-2 border-purple-500/30 transform hover:scale-105 transition-transform duration-300"
            />
          )}
        </div>

        <div className="md:col-span-2 flex flex-col justify-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
            {movie.title}
          </h1>
          <p className="text-lg text-purple-300 font-semibold mb-6">
            {movie.tagline}
          </p>

          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="flex items-center gap-2 text-yellow-400">
              <i className="fas fa-star"></i>
              <span className="font-bold text-xl">{movie.vote_average.toFixed(1)}</span>
              <span className="text-gray-400 text-sm">/ 10</span>
            </div>
            <span className="text-gray-300">{new Date(movie.release_date).getFullYear()}</span>
            {movie.runtime && (
              <span className="text-gray-300">{movie.runtime} min</span>
            )}
          </div>

          {movie.genres && movie.genres.length > 0 && (
            <div className="mb-6">
              <div className="flex flex-wrap gap-3">
                {movie.genres.map((genre) => (
                  <span
                    key={genre.id}
                    className="bg-white/10 backdrop-blur-sm text-purple-200 px-4 py-2 rounded-full text-sm font-medium border border-purple-400/20"
                  >
                    {genre.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mb-8">
            <h3 className="text-xl font-semibold text-white mb-3">Overview</h3>
            <p className="text-gray-300 leading-relaxed">{movie.overview}</p>
          </div>

          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleLogEmotions}
              className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-lg font-semibold text-lg hover:scale-105 transition-transform duration-300 shadow-lg shadow-purple-500/30"
            >
              <i className="fas fa-heart mr-2"></i>
              Log Emotions
            </button>
            <button 
              onClick={handleWatchlistToggle}
              className={`inline-block px-8 py-3 rounded-lg font-semibold text-lg transition-all duration-300 border ${
                isInWatchlist(movie?.id || 0)
                  ? 'bg-green-600/20 border-green-500/50 text-green-300 hover:bg-green-600/30'
                  : 'bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 border-purple-400/20'
              }`}
            >
              <i className={`mr-2 ${
                isInWatchlist(movie?.id || 0) ? 'fas fa-check' : 'fas fa-plus'
              }`}></i>
              {isInWatchlist(movie?.id || 0) ? 'In Watchlist' : 'Add to Watchlist'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieDetails;