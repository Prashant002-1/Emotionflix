import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Heart, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useDiary } from '../contexts/DiaryContext';
import { useUser } from '../contexts/UserContext';
import { CommunityEntry, discoveryService } from '../services/discoveryService';
import { dominantEmotion, emotionColors, emotionLabels, imageUrl, releaseYear } from '../utils/display';

const HomeActivity: React.FC = () => {
  const { user } = useUser();
  const { entries: diaryEntries, savedFilms, summary } = useDiary();
  const [entries, setEntries] = useState<CommunityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    discoveryService.feed(40)
      .then(nextEntries => active && setEntries(nextEntries))
      .catch(() => active && setError('Activity could not be loaded.'))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [user?.id]);

  const activeFilms = useMemo(() => {
    const groups = new Map<number, { entry: CommunityEntry; responses: number; people: Set<number>; reactions: number }>();
    entries.forEach(entry => {
      const group = groups.get(entry.movie_id);
      if (group) {
        group.responses += 1;
        group.people.add(entry.user_id);
        group.reactions += entry.reaction_count || 0;
      } else {
        groups.set(entry.movie_id, { entry, responses: 1, people: new Set([entry.user_id]), reactions: entry.reaction_count || 0 });
      }
    });
    return Array.from(groups.values())
      .sort((first, second) => (second.responses * 3 + second.people.size + second.reactions) - (first.responses * 3 + first.people.size + first.reactions))
      .slice(0, 6);
  }, [entries]);

  const activity = useMemo(() => {
    const followed = entries.filter(entry => entry.following);
    return (followed.length >= 6 ? followed : entries).slice(0, 10);
  }, [entries]);

  const summaryEmotion = summary ? dominantEmotion(summary) : null;

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
    <div className="page-shell product-home">
      <header className="product-home__header">
        <div><h1>{user?.displayName}</h1><p>@{user?.username}</p></div>
        <Link className="product-home__add" to="/log"><Plus size={16} />Add response</Link>
      </header>

      <dl className="usage-strip" aria-label="Account activity">
        <div><dt>Diary</dt><dd>{summary?.entries ?? diaryEntries.length}</dd></div>
        <div><dt>Public</dt><dd>{summary?.public_entries ?? diaryEntries.filter(entry => entry.visibility === 'public').length}</dd></div>
        <div><dt>Saved</dt><dd>{summary?.saved ?? savedFilms.length}</dd></div>
        <div><dt>Recurring feeling</dt><dd>{summaryEmotion ? emotionLabels[summaryEmotion.emotion] : 'Still forming'}</dd></div>
      </dl>

      {loading ? <div className="loading-state"><div className="loading-spinner" /><span>Loading activity</span></div> : error ? <div className="error-state"><p>{error}</p></div> : (
        <div className="product-home__grid">
          <main className="product-home__main">
            <section className="active-films" aria-labelledby="active-films-title">
              <header className="product-section-heading"><h2 id="active-films-title">Active films</h2><span>Across the people you follow and the wider community</span></header>
              <div className="active-film-row">
                {activeFilms.map(({ entry, responses, people }) => {
                  const poster = imageUrl(entry.poster_path, 'w342');
                  return (
                    <Link className="active-film" key={entry.movie_id} to={`/movie/${entry.movie_id}`}>
                      {poster ? <img alt={`Poster for ${entry.title}`} loading="lazy" src={poster} /> : <span className="active-film__placeholder" />}
                      <h3>{entry.title}</h3>
                      <p>{responses} {responses === 1 ? 'response' : 'responses'} · {people.size} {people.size === 1 ? 'person' : 'people'}</p>
                    </Link>
                  );
                })}
              </div>
            </section>

            <section className="activity-ledger" aria-labelledby="activity-title">
              <header className="product-section-heading"><h2 id="activity-title">Recent activity</h2><span>Newest first</span></header>
              {activity.map(entry => {
                const poster = imageUrl(entry.poster_path, 'w154');
                const feeling = dominantEmotion(entry);
                return (
                  <article className="activity-entry" key={entry.id}>
                    <Link className="person-avatar" to={`/member/${entry.username}`}>{entry.username.charAt(0).toUpperCase()}</Link>
                    <div className="activity-entry__meta">
                      <p><Link to={`/member/${entry.username}`}><strong>@{entry.username}</strong></Link> wrote about</p>
                      <time dateTime={entry.created_at}>{new Date(entry.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</time>
                    </div>
                    <Link className="activity-entry__poster" to={`/movie/${entry.movie_id}`}>
                      {poster ? <img alt={`Poster for ${entry.title}`} loading="lazy" src={poster} /> : <span />}
                    </Link>
                    <div className="activity-entry__response">
                      <Link to={`/movie/${entry.movie_id}`}><h3>{entry.title} <span>{releaseYear(entry.release_date)}</span></h3></Link>
                      <blockquote>{entry.note || 'No note added.'}</blockquote>
                      <div className="activity-entry__feeling">
                        {feeling && <><i style={{ backgroundColor: emotionColors[feeling.emotion] }} /><span>{emotionLabels[feeling.emotion]}</span></>}
                      </div>
                    </div>
                    <button aria-label={`${entry.reacted ? 'Remove reaction from' : 'React to'} ${entry.username}'s response`} aria-pressed={entry.reacted} className={`activity-entry__react${entry.reacted ? ' activity-entry__react--active' : ''}`} onClick={() => void toggleReaction(entry)} type="button">
                      <Heart fill={entry.reacted ? 'currentColor' : 'none'} size={15} /><span>{entry.reaction_count || 0}</span>
                    </button>
                  </article>
                );
              })}
            </section>
          </main>

          <aside className="product-home__aside">
            <section className="home-diary" aria-labelledby="home-diary-title">
              <header className="product-section-heading"><h2 id="home-diary-title">Your diary</h2><Link to="/diary">View all <ArrowRight size={14} /></Link></header>
              {diaryEntries.slice(0, 4).map(entry => {
                const poster = imageUrl(entry.poster_path, 'w154');
                return (
                  <Link className="home-diary__entry" key={entry.id} to={`/movie/${entry.movie_id}`}>
                    {poster ? <img alt="" aria-hidden="true" loading="lazy" src={poster} /> : <span />}
                    <div><h3>{entry.title}</h3><p>{new Date(`${entry.watched_on}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · {entry.visibility}</p></div>
                  </Link>
                );
              })}
              {!diaryEntries.length && <Link className="home-empty-action" to="/log">Add your first film</Link>}
            </section>

            <section className="home-saved" aria-labelledby="home-saved-title">
              <header className="product-section-heading"><h2 id="home-saved-title">Saved for later</h2><span>{savedFilms.length}</span></header>
              <div className="home-saved__grid">
                {savedFilms.slice(0, 6).map(film => {
                  const poster = imageUrl(film.poster_path, 'w154');
                  return poster ? <Link key={film.movie_id} to={`/movie/${film.movie_id}`}><img alt={`Poster for ${film.title}`} loading="lazy" src={poster} /></Link> : null;
                })}
              </div>
              {!savedFilms.length && <p className="home-saved__empty">Films you save will stay here.</p>}
            </section>
          </aside>
        </div>
      )}
    </div>
  );
};

export default HomeActivity;
