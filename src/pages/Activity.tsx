import { Heart, UserPlus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ActivityEvent, CommunityEntry, discoveryService } from '../services/discoveryService';
import { imageUrl } from '../utils/display';

type ActivityView = 'all' | 'reactions' | 'follows';

const Activity = () => {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [following, setFollowing] = useState<CommunityEntry[]>([]);
  const [view, setView] = useState<ActivityView>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([discoveryService.activity(), discoveryService.feed(30)])
      .then(([nextEvents, entries]) => {
        if (!active) return;
        setEvents(nextEvents);
        setFollowing(entries.filter(entry => entry.following).slice(0, 6));
      })
      .catch(() => active && setError('Activity could not be loaded.'))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const visibleEvents = useMemo(() => events.filter(event => {
    if (view === 'reactions') return event.kind === 'reaction';
    if (view === 'follows') return event.kind === 'follow';
    return true;
  }), [events, view]);

  return (
    <div className="page-shell activity-page">
      <header className="activity-toolbar">
        <div aria-label="Filter activity" className="product-section-tabs" role="group">
          <button aria-pressed={view === 'all'} onClick={() => setView('all')} type="button">All</button>
          <button aria-pressed={view === 'reactions'} onClick={() => setView('reactions')} type="button">Reactions</button>
          <button aria-pressed={view === 'follows'} onClick={() => setView('follows')} type="button">Follows</button>
        </div>
      </header>

      {loading ? <div className="loading-state"><div className="loading-spinner" /><span>Loading activity</span></div> : error ? (
        <div className="product-empty"><p>{error}</p></div>
      ) : (
        <div className="activity-layout">
          <section aria-label="Your activity" className="activity-list">
            {visibleEvents.length ? visibleEvents.map(event => {
              const eventDate = new Date(event.created_at);
              return (
                <article className="activity-event" key={`${event.kind}-${event.actor_id}-${event.entry_id || 'follow'}-${event.created_at}`}>
                  <Link className="activity-event__avatar" to={`/member/${event.username}`}>{event.username.charAt(0).toUpperCase()}</Link>
                  <div className="activity-event__body">
                    <p><Link to={`/member/${event.username}`}><strong>@{event.username}</strong></Link> {event.kind === 'reaction' ? <>reacted to your response to <Link to={`/movie/${event.movie_id}#response-${event.entry_id}`}><strong>{event.title}</strong></Link>.</> : 'followed you.'}</p>
                    {event.kind === 'reaction' && event.note && <blockquote>“{event.note}”</blockquote>}
                    <time dateTime={event.created_at}>{eventDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</time>
                  </div>
                  <div className="activity-event__mark">{event.kind === 'reaction' ? <Heart aria-hidden="true" size={17} /> : <UserPlus aria-hidden="true" size={17} />}</div>
                </article>
              );
            }) : <div className="product-empty"><p>No activity here yet.</p></div>}
          </section>

          <aside className="activity-circle">
            <h2>From people you follow</h2>
            {following.length ? following.map(entry => (
              <article className="activity-circle__entry" key={entry.id}>
                <Link to={`/movie/${entry.movie_id}`}>{imageUrl(entry.poster_path, 'w154') ? <img alt={`Poster for ${entry.title}`} loading="lazy" src={imageUrl(entry.poster_path, 'w154')!} /> : <span />}</Link>
                <div><Link to={`/member/${entry.username}`}>@{entry.username}</Link><Link to={`/movie/${entry.movie_id}`}><strong>{entry.title}</strong></Link><p>{entry.note || 'No note added.'}</p></div>
              </article>
            )) : <p className="metadata">Follow people to see their latest responses here.</p>}
          </aside>
        </div>
      )}
    </div>
  );
};

export default Activity;
