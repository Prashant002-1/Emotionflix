import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Movie } from '../../../types/movie';
import FilmPoster from './FilmPoster';

interface FilmRailProps {
  title: string;
  movies: Movie[];
  description?: string;
  linkLabel?: string;
  linkTo?: string;
}

const FilmRail: React.FC<FilmRailProps> = ({ title, movies, description, linkLabel, linkTo }) => {
  if (!movies.length) return null;

  return (
    <section className="film-rail" aria-labelledby={`rail-${title.replace(/\s+/g, '-').toLowerCase()}`}>
      <header className="film-rail__header">
        <div>
          <h2 id={`rail-${title.replace(/\s+/g, '-').toLowerCase()}`}>{title}</h2>
          {description && <p className="metadata film-rail__description">{description}</p>}
        </div>
        {linkLabel && linkTo && (
          <Link className="text-link" to={linkTo}>{linkLabel}<ArrowRight size={16} /></Link>
        )}
      </header>
      <div className="film-rail__track" role="list">
        {movies.map(movie => <div key={movie.id} role="listitem"><FilmPoster movie={movie} /></div>)}
      </div>
    </section>
  );
};

export default FilmRail;
