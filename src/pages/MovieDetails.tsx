import React, { useEffect, useState } from 'react';
import { Bookmark, Clock, Heart } from 'lucide-react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import BrandMark from '../components/brand/BrandMark';
import { ResponseComments } from '../components/discovery/ResponseComments';
import { ResponseFeelingTrace } from '../components/discovery/ResponseFeelingTrace';
import FilmRail from '../components/features/movie/FilmRail';
import { useDiary } from '../contexts/DiaryContext';
import { useUser } from '../contexts/UserContext';
import { catalogService } from '../services/catalogService';
import { CommunityEntry, discoveryService } from '../services/discoveryService';
import { EmotionScores } from '../types/emotion';
import { Movie } from '../types/movie';
import { emotionColors, emotionLabels, formatCalendarDate, formatRuntime, imageUrl, releaseYear } from '../utils/display';

const feelingKeys = Object.keys(emotionLabels) as (keyof EmotionScores)[];

const FilmFeelingDistribution = ({ entries }: { entries: CommunityEntry[] }) => {
  if (!entries.length) return null;
  const totals = feelingKeys.map(key => ({
    key,
    label: emotionLabels[key],
    value: entries.reduce((sum, entry) => sum + (Number(entry[key]) || 0), 0),
  }));
  const total = totals.reduce((sum, feeling) => sum + feeling.value, 0) || 1;
  const distribution = totals
    .map(feeling => ({ ...feeling, percent: Math.round((feeling.value / total) * 100) }))
    .filter(feeling => feeling.percent > 0)
    .sort((first, second) => second.percent - first.percent);

  return (
    <section className="film-feeling-distribution" aria-label={`Feelings recorded for ${entries[0].title}`}>
      <header><h2>What people felt</h2><p>{entries.length} {entries.length === 1 ? 'response' : 'responses'}</p></header>
      <div aria-hidden="true" className="film-feeling-distribution__trace">
        {distribution.map(feeling => <i key={feeling.key} style={{ backgroundColor: emotionColors[feeling.key], flexGrow: feeling.percent }} />)}
      </div>
      <dl>
        {distribution.map(feeling => <div key={feeling.key}><dt><i style={{ backgroundColor: emotionColors[feeling.key] }} />{feeling.label}</dt><dd>{feeling.percent}%</dd></div>)}
      </dl>
    </section>
  );
};

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
        const availableRelated = related.filter(item => item.poster_path);
        setMovie(details);
        setSimilar(availableRelated);
        setPublicEntries(entries);
        setView(entries.length > 0 || availableRelated.length === 0 ? 'responses' : 'related');
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

  const toggleLike = async (entry: CommunityEntry) => {
    if (!user) return;
    const next = !entry.liked;
    setPublicEntries(current => current.map(item => item.id === entry.id
      ? { ...item, liked: next, like_count: Math.max(0, item.like_count + (next ? 1 : -1)) }
      : item));
    try {
      if (next) await discoveryService.like(entry.id);
      else await discoveryService.unlike(entry.id);
    } catch {
      setPublicEntries(current => current.map(item => item.id === entry.id
        ? { ...item, liked: !next, like_count: Math.max(0, item.like_count + (next ? -1 : 1)) }
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
      <section className={`details-hero${publicEntries.length === 0 ? ' details-hero--without-responses' : ''}`}>
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
                  <Bookmark fill={isSaved(movie.id) ? 'currentColor' : 'none'} size={17} />{saving ? 'Saving' : isSaved(movie.id) ? 'Saved' : 'Save for later'}
                </button>
                <Link className="button button--primary" to={`/log?movieId=${movie.id}`}>{isLogged(movie.id) ? 'Add another response' : 'Add response'}</Link>
              </div>
            ) : (
              <p className="metadata details-auth-note">Enter the demo to save this film or add it to the diary.</p>
            )}
            {notice && <p className="metadata details-status" role="status">{notice}</p>}
          </div>
          <FilmFeelingDistribution entries={publicEntries} />
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
              return (
                <article className="film-response" id={`response-${entry.id}`} key={entry.id}>
                  <div className="public-entry__byline"><Link className="person-avatar person-avatar--small" to={`/member/${entry.username}`}>{entry.username.charAt(0).toUpperCase()}</Link><p><Link to={`/member/${entry.username}`}><strong>@{entry.username}</strong></Link><span>{formatCalendarDate(entry.watched_on, { month: 'short', day: 'numeric', year: 'numeric' })}</span></p></div>
                  <div className="film-response__body">
                    <blockquote>{entry.note || 'No note on this viewing.'}</blockquote>
                    <ResponseFeelingTrace entry={entry} />
                    <div className="film-response__actions"><button aria-label={`${entry.liked ? 'Unlike' : 'Like'} @${entry.username}'s response`} aria-pressed={entry.liked} className={`like-button${entry.liked ? ' like-button--active' : ''}`} disabled={!user} onClick={() => void toggleLike(entry)} type="button"><Heart fill={entry.liked ? 'currentColor' : 'none'} size={16} />{entry.like_count || 0} {(entry.like_count || 0) === 1 ? 'like' : 'likes'}</button><ResponseComments entryId={entry.id} initialCount={entry.comment_count} /></div>
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
