import React, { useEffect, useState } from 'react';
import { Heart, UserMinus, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { CommunityEntry, CommunityPerson, discoveryService } from '../services/discoveryService';
import { EmotionScores } from '../types/emotion';
import { dominantEmotion, emotionColors, imageUrl } from '../utils/display';

const feelingName = (key: keyof EmotionScores) => ({
  neutral: 'stillness', happy: 'joy', sad: 'melancholy', angry: 'friction', fearful: 'tension', disgusted: 'unease', surprised: 'wonder',
})[key];

const Community: React.FC = () => {
  const { user } = useUser();
  const [entries, setEntries] = useState<CommunityEntry[]>([]);
  const [people, setPeople] = useState<CommunityPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([discoveryService.feed(30), discoveryService.people()])
      .then(([nextEntries, nextPeople]) => {
        if (!active) return;
        setEntries(nextEntries);
        setPeople(nextPeople);
      })
      .catch(() => active && setError('Community discovery could not be loaded.'))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [user?.id]);

  const toggleFollow = async (person: CommunityPerson) => {
    if (!user) return;
    const next = !person.following;
    setPeople(current => current.map(item => item.id === person.id ? { ...item, following: next } : item));
    setEntries(current => current.map(item => item.user_id === person.id ? { ...item, following: next } : item));
    try {
      if (next) await discoveryService.follow(person.id);
      else await discoveryService.unfollow(person.id);
    } catch {
      setPeople(current => current.map(item => item.id === person.id ? { ...item, following: !next } : item));
      setEntries(current => current.map(item => item.user_id === person.id ? { ...item, following: !next } : item));
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

  return (
    <div className="page-shell community-page">
      <header className="page-header">
        <div className="page-header__copy"><h1 className="page-title">Films through other people.</h1><p className="page-intro">Public diary entries from people recording their own response. Follow a person because the pattern feels familiar, not because a title is trending.</p></div>
      </header>

      {loading ? <div className="loading-state"><div className="loading-spinner" /><span>Reading public diaries</span></div> : error ? <div className="error-state"><p>{error}</p></div> : (
        <div className="community-layout">
          <aside className="people-column">
            <div className="people-column__heading"><h2>People near your taste</h2>{!user && <p>Sign in to follow a diary.</p>}</div>
            {people.length ? people.map(person => {
              const emotion = dominantEmotion(person);
              return (
                <article className="person-row" key={person.id}>
                  <Link className="person-avatar" to={`/member/${person.username}`}>{person.username.charAt(0).toUpperCase()}</Link>
                  <div><Link to={`/member/${person.username}`}><h3>@{person.username}</h3></Link><p>{person.bio || `${person.entries} public diar${person.entries === 1 ? 'y entry' : 'y entries'}`}</p>{emotion && <span><i style={{ background: emotionColors[emotion.emotion] }} />Often records {feelingName(emotion.emotion)}{user && person.pattern_overlap !== null ? ` · ${Math.round(person.pattern_overlap * 100)}% pattern overlap` : ''}</span>}</div>
                  {user && <button aria-label={`${person.following ? 'Unfollow' : 'Follow'} ${person.username}`} className="icon-button" onClick={() => void toggleFollow(person)} type="button">{person.following ? <UserMinus size={18} /> : <UserPlus size={18} />}</button>}
                </article>
              );
            }) : <p className="community-empty">People will appear here as public diaries begin to form recognizable patterns.</p>}
          </aside>

          <section className="public-diary" aria-labelledby="public-diary-title">
            <header className="section-heading-row"><div><h2 id="public-diary-title">Public diary</h2><p>Newest entries first, with followed diaries moved closer.</p></div></header>
            {entries.length ? entries.map(entry => {
              const emotion = dominantEmotion(entry);
              return (
                <article className="public-entry" key={entry.id}>
                  <Link className="public-entry__art" to={`/movie/${entry.movie_id}`}>{imageUrl(entry.poster_path, 'w342') ? <img alt={`Poster for ${entry.title}`} loading="lazy" src={imageUrl(entry.poster_path, 'w342')!} /> : <div />}</Link>
                  <div className="public-entry__body">
                    <div className="public-entry__byline"><Link className="person-avatar person-avatar--small" to={`/member/${entry.username}`}>{entry.username.charAt(0).toUpperCase()}</Link><p><Link to={`/member/${entry.username}`}><strong>@{entry.username}</strong></Link><small>{new Date(entry.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</small></p></div>
                    <Link to={`/movie/${entry.movie_id}`}><h3>{entry.title}</h3></Link>
                    <p className="public-entry__meta">{entry.rating ? `${entry.rating} / 5` : 'No rating'}{emotion ? ` · ${feelingName(emotion.emotion)}` : ''}</p>
                    <blockquote>{entry.note || 'No note on this viewing.'}</blockquote>
                    <button aria-pressed={entry.reacted} className={`reaction-button${entry.reacted ? ' reaction-button--active' : ''}`} disabled={!user} onClick={() => void toggleReaction(entry)} type="button"><Heart fill={entry.reacted ? 'currentColor' : 'none'} size={17} />{entry.reaction_count || 0}<span className="sr-only">{user ? 'Mark as resonant' : 'Sign in to react'}</span></button>
                  </div>
                </article>
              );
            }) : <div className="community-empty"><h3>No public entries yet.</h3><p>Publish an entry from your diary to begin the shared record.</p><Link className="button button--secondary" to="/diary">Open your diary</Link></div>}
          </section>
        </div>
      )}
    </div>
  );
};

export default Community;
