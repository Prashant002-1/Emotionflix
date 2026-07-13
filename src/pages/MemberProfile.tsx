import React, { useEffect, useMemo, useState } from 'react';
import { Heart, UserMinus, UserPlus } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import FilmRail from '../components/features/movie/FilmRail';
import { useUser } from '../contexts/UserContext';
import { CommunityEntry, discoveryService, MemberProfile as MemberProfileData } from '../services/discoveryService';
import { EmotionScores } from '../types/emotion';
import { Movie } from '../types/movie';
import { dominantEmotion, emotionColors, imageUrl } from '../utils/display';

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
  vote_average: entry.vote_average || 0,
  vote_count: 0,
});

const MemberProfile: React.FC = () => {
  const { username = '' } = useParams();
  const { user } = useUser();
  const [person, setPerson] = useState<MemberProfileData | null>(null);
  const [entries, setEntries] = useState<CommunityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    discoveryService.profile(username)
      .then(result => { if (active) { setPerson(result.person); setEntries(result.entries); } })
      .catch(() => active && setError('This public diary could not be loaded.'))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [username, user?.id]);

  const films = useMemo(() => {
    const unique = new Map<number, Movie>();
    entries.forEach(entry => unique.set(entry.movie_id, entryMovie(entry)));
    return [...unique.values()];
  }, [entries]);

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

  if (loading) return <div className="loading-state page-loading"><div className="loading-spinner" /><span>Opening public diary</span></div>;
  if (error || !person) return <div className="page-shell"><div className="error-state"><h1>{error || 'Member not found'}</h1><Link className="button button--secondary" to="/community">Return to community</Link></div></div>;

  const emotion = dominantEmotion(person);
  const backdrop = entries.find(entry => entry.backdrop_path)?.backdrop_path;

  return (
    <div className="member-page">
      <header className="member-hero">
        {backdrop && <img alt="" aria-hidden="true" src={imageUrl(backdrop, 'w1280') || ''} />}
        <div className="member-hero__scrim" />
        <div className="member-hero__content">
          <div className="member-avatar">{person.username.charAt(0).toUpperCase()}</div>
          <div><h1>@{person.username}</h1><p>{person.bio || `${person.entries} public diary entries.`}</p><div className="member-facts"><span>{person.entries} public {person.entries === 1 ? 'entry' : 'entries'}</span><span>{person.followers} {person.followers === 1 ? 'follower' : 'followers'}</span><span>{person.following_count} following</span>{emotion && <span><i style={{ background: emotionColors[emotion.emotion] }} />Often records {feelingName(emotion.emotion)}</span>}</div></div>
          {user && user.id !== person.id && <button className="button button--primary" onClick={() => void toggleFollow()} type="button">{person.following ? <UserMinus size={18} /> : <UserPlus size={18} />}{person.following ? 'Unfollow diary' : 'Follow diary'}</button>}
        </div>
      </header>

      <div className="page-shell member-content">
        {films.length > 0 && <FilmRail description={`Films across @${person.username}'s public entries.`} movies={films.slice(0, 14)} title="Films in this diary" />}
        <section className="member-entries" aria-labelledby="member-entries-title">
          <header className="section-heading-row"><div><h2 id="member-entries-title">Public entries</h2><p>The record behind the pattern.</p></div></header>
          {entries.map(entry => {
            const entryEmotion = dominantEmotion(entry);
            return (
              <article className="public-entry" key={entry.id}>
                <Link className="public-entry__art" to={`/movie/${entry.movie_id}`}>{entry.poster_path ? <img alt={`Poster for ${entry.title}`} loading="lazy" src={imageUrl(entry.poster_path, 'w342') || ''} /> : <div />}</Link>
                <div className="public-entry__body"><p className="public-entry__meta">{new Date(`${entry.watched_on}T12:00:00`).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</p><Link to={`/movie/${entry.movie_id}`}><h3>{entry.title}</h3></Link><p className="public-entry__meta">{entry.rating ? `${entry.rating} / 5` : 'No rating'}{entryEmotion ? ` · ${feelingName(entryEmotion.emotion)}` : ''}</p><blockquote>{entry.note || 'No note on this viewing.'}</blockquote><button aria-pressed={entry.reacted} className={`reaction-button${entry.reacted ? ' reaction-button--active' : ''}`} disabled={!user} onClick={() => void toggleReaction(entry)} type="button"><Heart fill={entry.reacted ? 'currentColor' : 'none'} size={17} />{entry.reaction_count || 0}<span className="sr-only">Mark as resonant</span></button></div>
              </article>
            );
          })}
        </section>
      </div>
    </div>
  );
};

export default MemberProfile;
