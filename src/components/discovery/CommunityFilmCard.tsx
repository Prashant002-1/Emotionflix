import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CommunityFilm } from '../../services/discoveryService';
import { imageUrl, releaseYear } from '../../utils/display';

interface CommunityFilmCardProps {
  film: CommunityFilm;
  variant?: 'default' | 'feature' | 'compact';
}

export function CommunityFilmCard({ film, variant = 'default' }: CommunityFilmCardProps) {
  const poster = imageUrl(film.poster_path, 'w342');

  return (
    <article className={`community-film-card community-film-card--${variant}`}>
      <Link className="community-film-card__poster" to={`/movie/${film.movie_id}`}>
        {poster ? <img alt={`Poster for ${film.title}`} loading="lazy" src={poster} /> : <span />}
      </Link>
      <div className="community-film-card__body">
        <Link to={`/movie/${film.movie_id}`}><h3>{film.title}</h3></Link>
        <p className="community-film-card__meta">{releaseYear(film.release_date)} · {film.people_count} {film.people_count === 1 ? 'person' : 'people'} responded</p>
        {film.latest_note && <blockquote>“{film.latest_note}”</blockquote>}
        <div className="community-film-card__footer">
          <Link to={`/member/${film.latest_username}`}>@{film.latest_username}</Link>
          <Link aria-label={`Open ${film.title}`} to={`/movie/${film.movie_id}`}><ArrowUpRight size={15} /></Link>
        </div>
      </div>
    </article>
  );
}
