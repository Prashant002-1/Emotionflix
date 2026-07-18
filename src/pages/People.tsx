import React, { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { CommunityPerson, discoveryService } from '../services/discoveryService';
import { imageUrl } from '../utils/display';

type PeopleView = 'following' | 'all';

const People: React.FC = () => {
  const { user } = useUser();
  const [people, setPeople] = useState<CommunityPerson[]>([]);
  const [view, setView] = useState<PeopleView>('following');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    discoveryService.people()
      .then(nextPeople => active && setPeople(nextPeople.filter(person => person.id !== user?.id)))
      .catch(() => active && setError('People could not be loaded.'))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [user?.id]);

  const visiblePeople = useMemo(
    () => {
      const base = view === 'following' ? people.filter(person => person.following) : people;
      const term = query.trim().toLowerCase();
      if (!term) return base;
      return base.filter(person => person.username.toLowerCase().includes(term) || person.bio?.toLowerCase().includes(term) || person.latest_title?.toLowerCase().includes(term) || person.shared_film_title?.toLowerCase().includes(term));
    },
    [people, query, view],
  );

  const toggleFollow = async (person: CommunityPerson) => {
    const next = !person.following;
    setPeople(current => current.map(item => item.id === person.id ? { ...item, following: next } : item));
    try {
      if (next) await discoveryService.follow(person.id);
      else await discoveryService.unfollow(person.id);
    } catch {
      setPeople(current => current.map(item => item.id === person.id ? { ...item, following: !next } : item));
    }
  };

  return (
    <div className="page-shell people-page">
      <header className="people-header">
        <label className="people-search"><Search aria-hidden="true" size={17} /><input aria-label="Search people" onChange={event => setQuery(event.target.value)} placeholder="Search people or films" type="search" value={query} /></label>
        <div aria-label="Choose people view" className="product-section-tabs" role="group">
          <button aria-pressed={view === 'following'} onClick={() => setView('following')} type="button">Following</button>
          <button aria-pressed={view === 'all'} onClick={() => setView('all')} type="button">Discover</button>
        </div>
      </header>

      {!loading && people.length > 0 && <dl className="people-summary"><div><dt>Following</dt><dd>{people.filter(person => person.following).length}</dd></div><div><dt>Connected through a film</dt><dd>{people.filter(person => person.shared_film_title).length}</dd></div><div><dt>Follow you</dt><dd>{people.filter(person => person.follows_you).length}</dd></div></dl>}

      {loading ? (
        <div className="loading-state" role="status"><div className="loading-spinner" /><span>Loading people</span></div>
      ) : error ? (
        <div className="product-empty"><p>{error}</p></div>
      ) : visiblePeople.length ? (
        <section aria-label={view === 'following' ? 'People you follow' : 'All people'} className="people-list">
          {visiblePeople.map(person => (
            <article className="people-row" key={person.id}>
              <Link aria-label={`Open ${person.latest_title}`} className="people-row__film" to={`/movie/${person.latest_movie_id}`}>
                {imageUrl(person.latest_poster_path, 'w342') ? <img alt={`Poster for ${person.latest_title}`} loading="lazy" src={imageUrl(person.latest_poster_path, 'w342')!} /> : <span />}
              </Link>
              <div className="people-row__body">
                <div className="people-row__person">
                  <Link aria-label={`Open @${person.username}'s profile`} className="people-row__avatar" to={`/member/${person.username}`}>{person.username.charAt(0).toUpperCase()}</Link>
                  <div><Link to={`/member/${person.username}`}><h2>@{person.username}</h2></Link><p>{person.bio || `${person.entries} public ${person.entries === 1 ? 'response' : 'responses'}.`}</p>{person.follows_you && <span className="people-row__follows-you">Follows you</span>}</div>
                </div>
                {person.shared_film_title && <p className="people-row__connection">You both responded to <strong>{person.shared_film_title}</strong>.</p>}
                <Link className="people-row__latest" to={`/movie/${person.latest_movie_id}`}><span>Recently watched</span><strong>{person.latest_title}</strong>{person.latest_note && <q>{person.latest_note}</q>}</Link>
                <div className="people-row__bottom">
                  <span>{person.entries} responses · {person.followers} followers</span>
                  <button aria-pressed={person.following} className={`people-row__follow${person.following ? ' people-row__follow--active' : ''}`} onClick={() => void toggleFollow(person)} type="button">{person.following ? 'Following' : 'Follow'}</button>
                  <Link aria-label={`Open @${person.username}'s profile`} className="people-row__open" to={`/member/${person.username}`}><ArrowUpRight size={16} /></Link>
                </div>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <div className="product-empty"><p>{view === 'following' ? 'You are not following anyone yet.' : 'No people found.'}</p>{view === 'following' && people.length > 0 && <button className="text-link" onClick={() => setView('all')} type="button">Find people</button>}</div>
      )}
    </div>
  );
};

export default People;
