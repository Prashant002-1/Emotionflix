import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EmotionScores } from '../../types/emotion';
import { Movie } from '../../types/movie';
import { imageUrl, releaseYear } from '../../utils/display';
import BrandMark from '../brand/BrandMark';
import { RecommendationEvidence } from './RecommendationEvidence';

interface RecommendationSpotlightProps {
  movie: Movie;
  compact?: boolean;
  requestedFeelings?: (keyof EmotionScores)[];
  showAllLink?: boolean;
}

export function RecommendationSpotlight({ movie, compact = false, requestedFeelings = [], showAllLink = true }: RecommendationSpotlightProps) {
  const person = movie.recommended_by?.[0];
  const poster = imageUrl(movie.poster_path, 'w500');

  if (!person) return null;

  const filmLink = `/movie/${movie.id}?from=${encodeURIComponent(person.username)}&through=${encodeURIComponent(person.shared_film_title)}`;

  return (
    <section className={`journey-moment${compact ? ' journey-moment--compact' : ''}`} aria-labelledby={`recommendation-${movie.id}`}>
      <Link className="journey-moment__poster" to={filmLink}>
        {poster ? <img alt={`Poster for ${movie.title}`} src={poster} /> : <span><BrandMark /></span>}
      </Link>
      <div className="journey-moment__story">
        <p className="journey-moment__connection">
          Recommended through <Link to={`/member/${person.username}`}>@{person.username}</Link>
        </p>
        <h2 id={`recommendation-${movie.id}`}>{movie.title}</h2>
        <p className="journey-moment__year">{releaseYear(movie.release_date)}</p>
        <RecommendationEvidence connection={person} movieTitle={movie.title} requestedFeelings={requestedFeelings} showComparison />
        {person.response_note && (
          <blockquote className="journey-moment__response"><span className="journey-moment__response-label">@{person.username} on {movie.title}</span>“{person.response_note}”</blockquote>
        )}
        <div className="journey-moment__actions">
          <Link className="journey-moment__open" to={filmLink}>Open film <ArrowUpRight aria-hidden="true" size={15} /></Link>
          {showAllLink && <Link className="journey-moment__continue" to="/recommendations">See recommendations</Link>}
        </div>
      </div>
    </section>
  );
}
