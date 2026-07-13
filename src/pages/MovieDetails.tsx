import React, { useEffect, useState } from 'react';
import { Bookmark, Check, Clock, Star } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import BrandMark from '../components/brand/BrandMark';
import FilmRail from '../components/features/movie/FilmRail';
import { useDiary } from '../contexts/DiaryContext';
import { useUser } from '../contexts/UserContext';
import { catalogService } from '../services/catalogService';
import { CommunityEntry, discoveryService } from '../services/discoveryService';
import { Movie } from '../types/movie';
import { formatRuntime, imageUrl, releaseYear } from '../utils/display';

const MovieDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useUser();
  const { isLogged, isSaved, saveFilm, unsaveFilm } = useDiary();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [similar, setSimilar] = useState<Movie[]>([]);
  const [publicEntries, setPublicEntries] = useState<CommunityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const movieId = Number(id);
    if (!movieId) {
      setError('This film link is not valid.');
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    Promise.all([catalogService.movie(movieId), catalogService.related(movieId), discoveryService.filmEntries(movieId).catch(() => [])])
      .then(([details, related, entries]) => {
        if (!active) return;
        setMovie(details);
        setSimilar(related.filter(item => item.poster_path));
        setPublicEntries(entries);
      })
      .catch(() => active && setError('Film details could not be loaded.'))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [id]);

  const toggleSaved = async () => {
    if (!movie || !user) return;
    setSaving(true);
    setNotice('');
    try {
      if (isSaved(movie.id)) await unsaveFilm(movie.id);
      else await saveFilm(movie.id);
      setNotice(isSaved(movie.id) ? 'Removed from saved films.' : 'Saved for later.');
    } catch {
      setNotice('That change could not be saved. Try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading-state page-loading"><div className="loading-spinner" /><span>Loading film</span></div>;
  if (error || !movie) return <div className="error-state page-loading"><BrandMark /><h1>{error || 'Film not found'}</h1></div>;

  const backdrop = imageUrl(movie.backdrop_path, 'w1280');
  const poster = imageUrl(movie.poster_path, 'w500');
  const runtime = formatRuntime(movie.runtime);

  return (
    <>
      <section className="details-hero">
        {backdrop && <img alt="" aria-hidden="true" className="details-hero__backdrop" src={backdrop} />}
        <div className="details-hero__scrim" />
        <div className="details-hero__content">
          {poster ? <img alt={`Poster for ${movie.title}`} className="details-hero__poster" src={poster} /> : <div className="film-poster__fallback"><BrandMark /></div>}
          <div className="details-hero__copy">
            <h1 className="details-hero__title">{movie.title}</h1>
            {movie.tagline && <p className="details-hero__tagline">{movie.tagline}</p>}
            <div className="details-meta">
              <span>{releaseYear(movie.release_date)}</span>
              {runtime && <span className="rating"><Clock size={15} />{runtime}</span>}
              {movie.vote_average > 0 && <span className="rating"><Star size={15} />{movie.vote_average.toFixed(1)} / 10</span>}
              {movie.genres?.map(genre => <span key={genre.id}>{genre.name}</span>)}
            </div>
            <p className="details-overview">{movie.overview || 'No synopsis is available for this film.'}</p>
            {user ? (
              <div className="details-actions">
                <button className="button button--secondary" disabled={saving} onClick={() => void toggleSaved()} type="button">
                  {isSaved(movie.id) ? <Check size={17} /> : <Bookmark size={17} />}{saving ? 'Saving' : isSaved(movie.id) ? 'Saved' : 'Save for later'}
                </button>
                <Link className="button button--primary" to={`/log?movieId=${movie.id}`}><Check size={17} />{isLogged(movie.id) ? 'Log another viewing' : 'Add to diary'}</Link>
              </div>
            ) : (
              <p className="metadata details-auth-note">Sign in from the menu to save this film or add it to your history.</p>
            )}
            {notice && <p className="metadata details-status" role="status">{notice}</p>}
          </div>
        </div>
      </section>

      {publicEntries.length > 0 && (
        <section className="film-responses landing-section" aria-labelledby="film-responses-title">
          <header className="section-heading-row"><div><h2 id="film-responses-title">What this film left with people</h2><p>Public entries for this film, in their own words.</p></div></header>
          <div className="film-response-list">
            {publicEntries.slice(0, 6).map(entry => (
              <article className="film-response" key={entry.id}>
                <div className="public-entry__byline"><Link className="person-avatar person-avatar--small" to={`/member/${entry.username}`}>{entry.username.charAt(0).toUpperCase()}</Link><p><Link to={`/member/${entry.username}`}><strong>@{entry.username}</strong></Link><small>{entry.rating ? `${entry.rating} / 5` : 'No rating'}</small></p></div>
                <blockquote>{entry.note || 'No note on this viewing.'}</blockquote>
              </article>
            ))}
          </div>
        </section>
      )}

      {similar.length > 0 && <div className="landing-section landing-section--tight"><FilmRail movies={similar} title="More like this" /></div>}
    </>
  );
};

export default MovieDetails;
