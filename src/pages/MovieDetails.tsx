import React, { useEffect, useState } from 'react';
import { Bookmark, Check, Clock, Heart } from 'lucide-react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import BrandMark from '../components/brand/BrandMark';
import FilmRail from '../components/features/movie/FilmRail';
import { useDiary } from '../contexts/DiaryContext';
import { useUser } from '../contexts/UserContext';
import { catalogService } from '../services/catalogService';
import { CommunityEntry, discoveryService } from '../services/discoveryService';
import { Movie } from '../types/movie';
import { dominantEmotion, emotionColors, emotionLabels, formatCalendarDate, formatRuntime, imageUrl, releaseYear } from '../utils/display';

const MovieDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { user } = useUser();
  const { isLogged, isSaved, saveFilm, unsaveFilm } = useDiary();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [similar, setSimilar] = useState<Movie[]>([]);
  const [publicEntries, setPublicEntries] = useState<CommunityEntry[]>([]);
  const [view, setView] = useState<'responses' | 'related'>('responses');
  const [responseScope, setResponseScope] = useState<'circle' | 'everyone'>('everyone');
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

  useEffect(() => {
    if (!publicEntries.length || !window.location.hash) return;
    const target = document.getElementById(window.location.hash.slice(1));
    if (!target) return;
    const frame = window.requestAnimationFrame(() => target.scrollIntoView({ block: 'center' }));
    return () => window.cancelAnimationFrame(frame);
  }, [publicEntries]);

  const toggleSaved = async () => {
    if (!movie || !user) return;
    const wasSaved = isSaved(movie.id);
    setSaving(true);
    setNotice('');
    try {
      if (wasSaved) await unsaveFilm(movie.id);
      else await saveFilm(movie.id);
      setNotice(wasSaved ? 'Removed from saved films.' : 'Saved for later.');
    } catch {
      setNotice('That change could not be saved. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const toggleReaction = async (entry: CommunityEntry) => {
    if (!user) return;
    const next = !entry.reacted;
    setPublicEntries(current => current.map(item => item.id === entry.id
      ? { ...item, reacted: next, reaction_count: Math.max(0, item.reaction_count + (next ? 1 : -1)) }
      : item));
    try {
      if (next) await discoveryService.react(entry.id);
      else await discoveryService.unreact(entry.id);
    } catch {
      setPublicEntries(current => current.map(item => item.id === entry.id
        ? { ...item, reacted: !next, reaction_count: Math.max(0, item.reaction_count + (next ? -1 : 1)) }
        : item));
    }
  };

  if (loading) return <div className="loading-state page-loading"><div className="loading-spinner" /><span>Loading film</span></div>;
  if (error || !movie) return <div className="error-state page-loading"><BrandMark /><h1>{error || 'Film not found'}</h1></div>;

  const backdrop = imageUrl(movie.backdrop_path, 'w1280');
  const poster = imageUrl(movie.poster_path, 'w500');
  const runtime = formatRuntime(movie.runtime);
  const fromPerson = searchParams.get('from');
  const throughFilm = searchParams.get('through');

  return (
    <>
      <section className="details-hero">
        {backdrop && <img alt="" aria-hidden="true" className="details-hero__backdrop" src={backdrop} />}
        <div className="details-hero__scrim" />
        <div className="details-hero__content">
          {poster ? <img alt={`Poster for ${movie.title}`} className="details-hero__poster" src={poster} /> : <div className="film-poster__fallback"><BrandMark /></div>}
          <div className="details-hero__copy">
            {fromPerson && throughFilm && <p className="details-connection"><Link to={`/member/${fromPerson}`}>@{fromPerson}</Link> reached you through <strong>{throughFilm}</strong>.</p>}
            <h1 className="details-hero__title">{movie.title}</h1>
            {movie.tagline && <p className="details-hero__tagline">{movie.tagline}</p>}
            <div className="details-meta">
              <span>{releaseYear(movie.release_date)}</span>
              {runtime && <span className="runtime-badge"><Clock size={15} />{runtime}</span>}
              {publicEntries.length > 0 && <span>{publicEntries.length} {publicEntries.length === 1 ? 'response' : 'responses'}</span>}
            </div>
            <p className="details-overview">{movie.overview || 'No synopsis is available for this film.'}</p>
            {user ? (
              <div className="details-actions">
                <button className="button button--secondary" disabled={saving} onClick={() => void toggleSaved()} type="button">
                  {isSaved(movie.id) ? <Check size={17} /> : <Bookmark size={17} />}{saving ? 'Saving' : isSaved(movie.id) ? 'Saved' : 'Save for later'}
                </button>
                <Link className="button button--primary" to={`/log?movieId=${movie.id}`}><Check size={17} />{isLogged(movie.id) ? 'Add another response' : 'Add response'}</Link>
              </div>
            ) : (
              <p className="metadata details-auth-note">Sign in from the menu to save this film or add it to your history.</p>
            )}
            {notice && <p className="metadata details-status" role="status">{notice}</p>}
          </div>
        </div>
      </section>

      <section className="page-shell details-content">
        <div aria-label="Choose film view" className="product-section-tabs details-content__tabs" role="group">
          <button aria-pressed={view === 'responses'} onClick={() => setView('responses')} type="button">Responses</button>
          <button aria-pressed={view === 'related'} onClick={() => setView('related')} type="button">More films</button>
        </div>

        {view === 'responses' && (publicEntries.length > 0 ? (
          <section className="film-responses" aria-label={`Public responses to ${movie.title}`}>
          <div className="film-response-scope product-section-tabs" aria-label="Filter film responses" role="group"><button aria-pressed={responseScope === 'everyone'} onClick={() => setResponseScope('everyone')} type="button">Everyone</button><button aria-pressed={responseScope === 'circle'} onClick={() => setResponseScope('circle')} type="button">Following</button></div>
          <div className="film-response-list">
            {(responseScope === 'circle' ? publicEntries.filter(entry => entry.following) : publicEntries).slice(0, 12).map(entry => {
              const feeling = dominantEmotion(entry);
              return (
                <article className="film-response" id={`response-${entry.id}`} key={entry.id}>
                  <div className="public-entry__byline"><Link className="person-avatar person-avatar--small" to={`/member/${entry.username}`}>{entry.username.charAt(0).toUpperCase()}</Link><p><Link to={`/member/${entry.username}`}><strong>@{entry.username}</strong></Link><span>{formatCalendarDate(entry.watched_on, { month: 'short', day: 'numeric', year: 'numeric' })}</span></p></div>
                  <div className="film-response__body">
                    <blockquote>{entry.note || 'No note on this viewing.'}</blockquote>
                    {feeling && <p className="film-response__feeling"><i style={{ backgroundColor: emotionColors[feeling.emotion] }} />{emotionLabels[feeling.emotion]}</p>}
                    <button aria-label={`${entry.reacted ? 'Remove reaction from' : 'React to'} @${entry.username}'s response`} aria-pressed={entry.reacted} className={`reaction-button${entry.reacted ? ' reaction-button--active' : ''}`} disabled={!user} onClick={() => void toggleReaction(entry)} type="button"><Heart fill={entry.reacted ? 'currentColor' : 'none'} size={16} />{entry.reaction_count || 0}</button>
                  </div>
                  {entry.expression_image_path && <img alt={entry.expression_image_alt || `Expression photo shared by ${entry.username}`} className="film-response__expression" loading="lazy" src={entry.expression_image_path} />}
                </article>
              );
            })}
          </div>
          {responseScope === 'circle' && !publicEntries.some(entry => entry.following) && <div className="product-empty"><p>No one you follow has responded to this film yet.</p><Link className="text-link" to="/people">Find people</Link></div>}
          </section>
        ) : <div className="product-empty"><p>No public responses yet.</p>{user && <Link className="text-link" to={`/log?movieId=${movie.id}`}>Add a response</Link>}</div>)}

        {view === 'related' && (similar.length > 0
          ? <FilmRail movies={similar} title="" />
          : <div className="product-empty"><p>No related films found.</p></div>)}
      </section>
    </>
  );
};

export default MovieDetails;
