import React from 'react';
import { Link } from 'react-router-dom';
import { Play, Star } from 'lucide-react';
import { Movie } from '../../../types/movie';
import { imageUrl, releaseYear } from '../../../utils/display';
import BrandMark from '../../brand/BrandMark';

interface FilmPosterProps {
  movie: Movie;
  actionLabel?: string;
}

const FilmPoster: React.FC<FilmPosterProps> = ({ movie, actionLabel = 'View film' }) => {
  const poster = imageUrl(movie.poster_path, 'w500');

  return (
    <article className="film-poster">
      <Link className="film-poster__link" to={`/movie/${movie.id}`} aria-label={`${actionLabel}: ${movie.title}`}>
        <div className="film-poster__art">
          {poster ? (
            <img alt={`Poster for ${movie.title}`} loading="lazy" src={poster} />
          ) : (
            <div className="film-poster__fallback"><BrandMark /></div>
          )}
          <div className="film-poster__overlay" aria-hidden="true">
            <span className="film-poster__action"><Play size={14} strokeWidth={2} />{actionLabel}</span>
          </div>
        </div>
        <h3 className="film-poster__title">{movie.title}</h3>
        <div className="film-poster__meta">
          <span>{releaseYear(movie.release_date)}</span>
          {movie.vote_average > 0 && (
            <span className="rating"><Star aria-hidden="true" size={13} strokeWidth={2} />{movie.vote_average.toFixed(1)}</span>
          )}
        </div>
        {movie.recommendation_reason && <p className="film-poster__reason">{movie.recommendation_reason}</p>}
      </Link>
    </article>
  );
};

export default FilmPoster;
