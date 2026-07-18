import React from 'react';
import { Link } from 'react-router-dom';
import { Movie } from '../../../types/movie';
import { imageUrl, releaseYear } from '../../../utils/display';
import BrandMark from '../../brand/BrandMark';

interface FilmPosterProps {
  movie: Movie;
  actionLabel?: string;
}

const FilmPoster: React.FC<FilmPosterProps> = ({ movie, actionLabel = 'View film' }) => {
  const poster = imageUrl(movie.poster_path, 'w500');
  const leadResponse = movie.recommended_by?.[0];

  return (
    <article className="film-poster">
      <Link className="film-poster__link" to={`/movie/${movie.id}`} aria-label={`${actionLabel}: ${movie.title}`}>
        <div className="film-poster__art">
          {poster ? (
            <img alt={`Poster for ${movie.title}`} loading="lazy" src={poster} />
          ) : (
            <div className="film-poster__fallback"><BrandMark /></div>
          )}
        </div>
        <h3 className="film-poster__title">{movie.title}</h3>
        <div className="film-poster__meta">
          <span>{releaseYear(movie.release_date)}</span>
        </div>
      </Link>
      {movie.recommended_by?.length ? <p className="film-poster__people">From {movie.recommended_by.slice(0, 2).map((person, index) => <React.Fragment key={person.id}>{index > 0 ? ' and ' : ''}<Link to={`/member/${person.username}`}>@{person.username}</Link></React.Fragment>)}</p> : null}
      {movie.recommendation_reason && <p className="film-poster__reason">{movie.recommendation_reason}</p>}
      {leadResponse?.response_note && <blockquote className="film-poster__response">{leadResponse.response_note}</blockquote>}
    </article>
  );
};

export default FilmPoster;
