import { ArrowUpRight, Heart } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CommunityFilmCard } from '../components/discovery/CommunityFilmCard';
import { ResponseComments } from '../components/discovery/ResponseComments';
import { ResponseFeelingTrace } from '../components/discovery/ResponseFeelingTrace';
import FilmRail from '../components/features/movie/FilmRail';
import { DiscoveryPathCard } from '../components/recommendations/DiscoveryPathCard';
import { RecommendationSpotlight } from '../components/recommendations/RecommendationSpotlight';
import { useDiary } from '../contexts/DiaryContext';
import { useUser } from '../contexts/UserContext';
import { CommunityEntry, CommunityFilm, CommunityPerson, discoveryService } from '../services/discoveryService';
import { recommendationService } from '../services/recommendationService';
import { savedFilmMovie } from '../types/diary';
import { Movie } from '../types/movie';
import { formatCalendarDate, imageUrl, releaseYear } from '../utils/display';

type FeedView = 'for-you' | 'following' | 'everyone';

interface ResponseCardProps {
  compact?: boolean;
  entry: CommunityEntry;
  ownUserId?: number;
  onFollow: (entry: CommunityEntry) => void;
  onLike: (entry: CommunityEntry) => void;
}

const ResponseCard = ({ compact = false, entry, ownUserId, onFollow, onLike }: ResponseCardProps) => {
  const poster = imageUrl(entry.poster_path, 'w342');
  const published = new Date(entry.created_at);

  return (
    <article className={`feed-response${compact ? ' feed-response--compact' : ''}`}>
      <header className="feed-response__byline">
        <Link aria-label={`Open @${entry.username}'s profile`} className="feed-response__avatar" to={`/member/${entry.username}`}>{entry.username.charAt(0).toUpperCase()}</Link>
        <div><Link to={`/member/${entry.username}`}><strong>@{entry.username}</strong></Link><time dateTime={entry.created_at}>{published.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</time></div>
        {entry.user_id !== ownUserId && <button aria-label={`${entry.following ? 'Unfollow' : 'Follow'} @${entry.username}`} aria-pressed={entry.following} className={`feed-response__follow${entry.following ? ' feed-response__follow--active' : ''}`} onClick={() => onFollow(entry)} type="button">{entry.following ? 'Following' : 'Follow'}</button>}
      </header>

      <div className={`feed-response__content${entry.expression_image_path ? ' feed-response__content--with-photo' : ''}`}>
        <Link className="feed-response__poster" to={`/movie/${entry.movie_id}`}>{poster ? <img alt={`Poster for ${entry.title}`} loading="lazy" src={poster} /> : <span />}</Link>
        <div className="feed-response__copy">
          <Link to={`/movie/${entry.movie_id}`}><h2>{entry.title} <span>{releaseYear(entry.release_date)}</span></h2></Link>
          <p className="feed-response__watched">Watched {formatCalendarDate(entry.watched_on, { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          <blockquote>{entry.note || 'No note added.'}</blockquote>
          <ResponseFeelingTrace entry={entry} />
        </div>
        {entry.expression_image_path && <img alt={entry.expression_image_alt || `Photo shared by ${entry.username}`} className="feed-response__photo" loading="lazy" src={entry.expression_image_path} />}
      </div>

      <footer className="feed-response__footer">
        <button aria-label={`${entry.liked ? 'Unlike' : 'Like'} ${entry.username}'s response`} aria-pressed={entry.liked} className={`feed-response__like${entry.liked ? ' feed-response__like--active' : ''}`} onClick={() => onLike(entry)} type="button"><Heart fill={entry.liked ? 'currentColor' : 'none'} size={16} /><span>{entry.like_count || 0} {(entry.like_count || 0) === 1 ? 'like' : 'likes'}</span></button>
        <ResponseComments entryId={entry.id} initialCount={entry.comment_count} />
        <Link className="feed-response__film-link" to={`/movie/${entry.movie_id}`}>Open film <ArrowUpRight aria-hidden="true" size={15} /></Link>
      </footer>
    </article>
  );
};

const Feed = () => {
  const { user, takeDemoHome } = useUser();
  const { savedFilms } = useDiary();
  const [entries, setEntries] = useState<CommunityEntry[]>([]);
  const [recommendations, setRecommendations] = useState<Movie[]>([]);
  const [people, setPeople] = useState<CommunityPerson[]>([]);
  const [pulse, setPulse] = useState<CommunityFilm[]>([]);
  const [view, setView] = useState<FeedView>('for-you');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    const bootstrap = takeDemoHome();
    if (bootstrap) {
      setEntries(bootstrap.entries);
      setRecommendations(bootstrap.recommendations.forYou.filter(movie => movie.recommended_by?.length));
      setPeople(bootstrap.people);
      setPulse(bootstrap.pulse);
      setLoading(false);
      return () => { active = false; };
    }
    Promise.all([
      discoveryService.feed(50),
      recommendationService.get().catch(() => null),
      discoveryService.people().catch(() => []),
      discoveryService.pulse().catch(() => []),
    ])
      .then(([nextEntries, nextRecommendations, nextPeople, nextPulse]) => {
        if (!active) return;
        setEntries(nextEntries);
        setRecommendations(nextRecommendations?.forYou.filter(movie => movie.recommended_by?.length) || []);
        setPeople(nextPeople);
        setPulse(nextPulse);
      })
      .catch(() => active && setError('Home could not be loaded.'))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [takeDemoHome, user?.id]);

  const followingEntries = useMemo(() => entries.filter(entry => entry.following || entry.user_id === user?.id), [entries, user?.id]);
  const visibleEntries = view === 'following' ? followingEntries : entries;
  const leadRecommendation = recommendations[0];

  const toggleLike = async (entry: CommunityEntry) => {
    if (!user) return;
    const next = !entry.liked;
    setEntries(current => current.map(item => item.id === entry.id ? { ...item, liked: next, like_count: Math.max(0, item.like_count + (next ? 1 : -1)) } : item));
    try {
      if (next) await discoveryService.like(entry.id);
      else await discoveryService.unlike(entry.id);
    } catch {
      setEntries(current => current.map(item => item.id === entry.id ? { ...item, liked: !next, like_count: Math.max(0, item.like_count + (next ? -1 : 1)) } : item));
    }
  };

  const toggleFollow = async (entry: CommunityEntry) => {
    if (!user || entry.user_id === user.id) return;
    const next = !entry.following;
    setEntries(current => current.map(item => item.user_id === entry.user_id ? { ...item, following: next } : item));
    setPeople(current => current.map(person => person.id === entry.user_id ? { ...person, following: next } : person));
    try {
      if (next) await discoveryService.follow(entry.user_id);
      else await discoveryService.unfollow(entry.user_id);
    } catch {
      setEntries(current => current.map(item => item.user_id === entry.user_id ? { ...item, following: !next } : item));
      setPeople(current => current.map(person => person.id === entry.user_id ? { ...person, following: !next } : person));
    }
  };

  const togglePerson = async (person: CommunityPerson) => {
    const next = !person.following;
    setPeople(current => current.map(item => item.id === person.id ? { ...item, following: next } : item));
    setEntries(current => current.map(entry => entry.user_id === person.id ? { ...entry, following: next } : entry));
    try {
      if (next) await discoveryService.follow(person.id);
      else await discoveryService.unfollow(person.id);
    } catch {
      setPeople(current => current.map(item => item.id === person.id ? { ...item, following: !next } : item));
      setEntries(current => current.map(entry => entry.user_id === person.id ? { ...entry, following: !next } : entry));
    }
  };

  return (
    <div className="page-shell feed-page">
      <header className="feed-page__header">
        <div aria-label="Choose home view" className="feed-tabs" role="group">
          <button aria-pressed={view === 'for-you'} onClick={() => setView('for-you')} type="button">For you</button>
          <button aria-pressed={view === 'following'} onClick={() => setView('following')} type="button">Following</button>
          <button aria-pressed={view === 'everyone'} onClick={() => setView('everyone')} type="button">Everyone</button>
        </div>
      </header>

      {loading ? <div className="loading-state"><div className="loading-spinner" /><span>Opening home</span></div> : error ? <div className="product-empty"><p>{error}</p></div> : view === 'for-you' ? (
        <div className="home-journey">
          {leadRecommendation && <RecommendationSpotlight compact movie={leadRecommendation} />}

          {recommendations.length > 1 && <section className="home-section" aria-labelledby="recommendations-title"><header><h2 id="recommendations-title">Recommended films</h2><Link to="/recommendations">See all</Link></header><div className="path-grid">{recommendations.slice(1, 5).map(movie => <DiscoveryPathCard key={movie.id} movie={movie} />)}</div></section>}

          <div className="home-social-grid">
            <section className="home-section home-section--responses" aria-labelledby="circle-title"><header><h2 id="circle-title">From your circle</h2><button onClick={() => setView(followingEntries.length ? 'following' : 'everyone')} type="button">See all</button></header><div className="home-response-stack">{(followingEntries.length ? followingEntries : entries).slice(0, 4).map(entry => <ResponseCard compact entry={entry} key={entry.id} onFollow={toggleFollow} onLike={toggleLike} ownUserId={user?.id} />)}</div></section>

            <section className="home-section home-section--people" aria-labelledby="people-title"><header><h2 id="people-title">People</h2><Link to="/people">See all</Link></header><div className="home-people-list">{people.slice(0, 6).map(person => <article className="home-person" key={person.id}><Link className="home-person__avatar" to={`/member/${person.username}`}>{person.username.charAt(0).toUpperCase()}</Link><div><Link to={`/member/${person.username}`}><strong>@{person.username}</strong></Link>{person.shared_film_title ? <p>Shared film: {person.shared_film_title}</p> : <p>{person.latest_title}</p>}</div><button aria-pressed={person.following} onClick={() => void togglePerson(person)} type="button">{person.following ? 'Following' : 'Follow'}</button></article>)}</div></section>
          </div>

          {pulse.length > 0 && <section className="home-section" aria-labelledby="pulse-title"><header><h2 id="pulse-title">Recent responses</h2><Link to="/search">Search films</Link></header><div className="community-film-grid">{pulse.slice(0, 6).map(film => <CommunityFilmCard film={film} key={film.movie_id} />)}</div></section>}

          {savedFilms.length > 0 && <FilmRail description="Films you kept for later." movies={savedFilms.map(savedFilmMovie).slice(0, 12)} title="Saved films" linkLabel="Open diary" linkTo="/diary" />}
        </div>
      ) : visibleEntries.length ? (
        <section aria-label={view === 'following' ? 'Responses from people you follow' : 'Public responses'} className="response-feed">{visibleEntries.map(entry => <ResponseCard entry={entry} key={entry.id} onFollow={toggleFollow} onLike={toggleLike} ownUserId={user?.id} />)}</section>
      ) : <div className="product-empty"><p>No responses here yet.</p><div className="product-empty__actions"><Link className="text-link" to="/people">Find people</Link><Link className="text-link" to="/log">Add a response</Link></div></div>}
    </div>
  );
};

export default Feed;
