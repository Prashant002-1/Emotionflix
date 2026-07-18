import React, { useEffect, useMemo, useState } from 'react';
import { Heart, UserMinus, UserPlus } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import FilmRail from '../components/features/movie/FilmRail';
import { useDiary } from '../contexts/DiaryContext';
import { useUser } from '../contexts/UserContext';
import { CommunityEntry, discoveryService, MemberProfile as MemberProfileData } from '../services/discoveryService';
import { EmotionScores } from '../types/emotion';
import { Movie } from '../types/movie';
import { dominantEmotion, formatCalendarDate, imageUrl } from '../utils/display';

const feelingName = (key: keyof EmotionScores) => ({
  neutral: 'stillness', happy: 'joy', sad: 'melancholy', angry: 'friction', fearful: 'tension', disgusted: 'unease', surprised: 'wonder',
})[key];

const entryMovie = (entry: CommunityEntry): Movie => ({
  id: entry.movie_id,
  title: entry.title,
  overview: '',
  release_date: entry.release_date,
  poster_path: entry.poster_path,
  backdrop_path: entry.backdrop_path,
  genre_ids: [],
  popularity: 0,
  vote_average: 0,
  vote_count: 0,
});

const MemberProfile: React.FC = () => {
  const { username = '' } = useParams();
  const { user } = useUser();
  const { entries: ownEntries } = useDiary();
  const [person, setPerson] = useState<MemberProfileData | null>(null);
  const [entries, setEntries] = useState<CommunityEntry[]>([]);
  const [view, setView] = useState<'responses' | 'shared' | 'films'>('responses');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    discoveryService.profile(username)
      .then(result => { if (active) { setPerson(result.person); setEntries(result.entries); } })
      .catch(() => active && setError('This profile could not be loaded.'))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [username, user?.id]);

  const films = useMemo(() => {
    const unique = new Map<number, Movie>();
    entries.forEach(entry => unique.set(entry.movie_id, entryMovie(entry)));
    return [...unique.values()];
  }, [entries]);
  const sharedEntries = useMemo(() => {
    const ownMovieIds = new Set(ownEntries.map(entry => entry.movie_id));
    return entries.filter(entry => ownMovieIds.has(entry.movie_id));
  }, [entries, ownEntries]);
  const visibleResponses = view === 'shared' ? sharedEntries : entries;

  const toggleFollow = async () => {
    if (!user || !person) return;
    const next = !person.following;
    setPerson({ ...person, following: next });
    try {
      if (next) await discoveryService.follow(person.id);
      else await discoveryService.unfollow(person.id);
    } catch {
      setPerson({ ...person, following: !next });
    }
  };

  const toggleReaction = async (entry: CommunityEntry) => {
    if (!user) return;
    const next = !entry.reacted;
    setEntries(current => current.map(item => item.id === entry.id ? { ...item, reacted: next, reaction_count: Math.max(0, item.reaction_count + (next ? 1 : -1)) } : item));
    try {
      if (next) await discoveryService.react(entry.id);
      else await discoveryService.unreact(entry.id);
    } catch {
      setEntries(current => current.map(item => item.id === entry.id ? { ...item, reacted: !next, reaction_count: Math.max(0, item.reaction_count + (next ? -1 : 1)) } : item));
    }
  };

  if (loading) return <div className="loading-state page-loading"><div className="loading-spinner" /><span>Opening profile</span></div>;
  if (error || !person) return <div className="page-shell"><div className="error-state"><h1>{error || 'Member not found'}</h1><Link className="button button--secondary" to="/feed">Return to feed</Link></div></div>;

  return (
    <div className="member-page">
      <header className="member-hero">
        <div className="member-hero__content">
          <div className="member-avatar">{person.username.charAt(0).toUpperCase()}</div>
          <div className="member-profile__identity"><h1>@{person.username}</h1><p>{person.bio || `${person.entries} public responses.`}</p>{person.shared_film_title && <p className="member-shared-film">You both responded to <strong>{person.shared_film_title}</strong>.</p>}<div className="member-facts"><span>{person.entries} {person.entries === 1 ? 'response' : 'responses'}</span><span>{person.followers} {person.followers === 1 ? 'follower' : 'followers'}</span><span>{person.following_count} following</span>{person.follows_you && <span>follows you</span>}</div></div>
          {user && user.id !== person.id && <button aria-label={`${person.following ? 'Unfollow' : 'Follow'} @${person.username}`} aria-pressed={person.following} className="button button--primary" onClick={() => void toggleFollow()} type="button">{person.following ? <UserMinus size={18} /> : <UserPlus size={18} />}{person.following ? 'Following' : 'Follow'}</button>}
        </div>
      </header>

      <div className="page-shell member-content">
        <div aria-label="Choose profile view" className="product-section-tabs member-content__tabs" role="group">
          <button aria-pressed={view === 'responses'} onClick={() => setView('responses')} type="button">Responses</button>
          <button aria-pressed={view === 'shared'} onClick={() => setView('shared')} type="button">Shared films {sharedEntries.length}</button>
          <button aria-pressed={view === 'films'} onClick={() => setView('films')} type="button">Films</button>
        </div>

        {(view === 'responses' || view === 'shared') && (visibleResponses.length ? <section aria-label={`${view === 'shared' ? 'Shared film responses' : 'Responses'} from @${person.username}`} className="member-entries">
          {visibleResponses.map(entry => {
            const entryEmotion = dominantEmotion(entry);
            return (
              <article className="public-entry" key={entry.id}>
                <Link className="public-entry__art" to={`/movie/${entry.movie_id}`}>{entry.poster_path ? <img alt={`Poster for ${entry.title}`} loading="lazy" src={imageUrl(entry.poster_path, 'w342') || ''} /> : <div />}</Link>
                <div className="public-entry__body">{entry.expression_image_path && <img alt={entry.expression_image_alt || `Expression photo shared by ${entry.username}`} className="public-entry__expression" loading="lazy" src={entry.expression_image_path} />}<p className="public-entry__meta">{formatCalendarDate(entry.watched_on, { month: 'long', day: 'numeric', year: 'numeric' })}</p><Link to={`/movie/${entry.movie_id}`}><h3>{entry.title}</h3></Link>{entryEmotion && <p className="public-entry__meta">{feelingName(entryEmotion.emotion)}</p>}<blockquote>{entry.note || 'No words added.'}</blockquote><button aria-label={`${entry.reacted ? 'Remove reaction from' : 'React to'} this response`} aria-pressed={entry.reacted} className={`reaction-button${entry.reacted ? ' reaction-button--active' : ''}`} disabled={!user} onClick={() => void toggleReaction(entry)} type="button"><Heart fill={entry.reacted ? 'currentColor' : 'none'} size={17} />{entry.reaction_count || 0}</button></div>
              </article>
            );
          })}
        </section> : <div className="product-empty"><p>{view === 'shared' ? 'You have not responded to the same film yet.' : 'No public responses yet.'}</p>{view === 'shared' && <Link className="text-link" to="/log">Add a response</Link>}</div>)}

        {view === 'films' && (films.length
          ? <FilmRail movies={films.slice(0, 14)} title="" />
          : <div className="product-empty"><p>No public films yet.</p></div>)}
      </div>
    </div>
  );
};

export default MemberProfile;
