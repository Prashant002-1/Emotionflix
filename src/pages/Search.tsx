import { Bookmark, Check, Search as SearchIcon } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CommunityFilmCard } from '../components/discovery/CommunityFilmCard';
import FilmRail from '../components/features/movie/FilmRail';
import { DiscoveryPathCard } from '../components/recommendations/DiscoveryPathCard';
import { RecommendationSpotlight } from '../components/recommendations/RecommendationSpotlight';
import { useDiary } from '../contexts/DiaryContext';
import { catalogService } from '../services/catalogService';
import { CommunityFilm, CommunityPerson, discoveryService } from '../services/discoveryService';
import { recommendationService } from '../services/recommendationService';
import { EmotionScores } from '../types/emotion';
import { Movie } from '../types/movie';
import { savedFilmMovie } from '../types/diary';
import { emotionLabels, imageUrl, releaseYear } from '../utils/display';

type SearchView = 'films' | 'feelings' | 'people';
const feelingKeys = Object.keys(emotionLabels) as (keyof EmotionScores)[];

const Search = () => {
  const { savedFilms, isSaved, saveFilm, unsaveFilm } = useDiary();
  const [view, setView] = useState<SearchView>('films');
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [results, setResults] = useState<Movie[]>([]);
  const [people, setPeople] = useState<CommunityPerson[]>([]);
  const [pulse, setPulse] = useState<CommunityFilm[]>([]);
  const [wantedFeelings, setWantedFeelings] = useState<(keyof EmotionScores)[]>([]);
  const [feelingResults, setFeelingResults] = useState<Movie[]>([]);
  const [feelingSearched, setFeelingSearched] = useState(false);
  const [feelingSearching, setFeelingSearching] = useState(false);
  const [feelingError, setFeelingError] = useState('');
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([discoveryService.people(), discoveryService.pulse()])
      .then(([nextPeople, films]) => {
        if (!active) return;
        setPeople(nextPeople);
        setPulse(films);
      })
      .catch(() => active && setError('Search could not be prepared.'))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const nextQuery = query.trim();
    if (!nextQuery) return;
    setSubmittedQuery(nextQuery);
    if (view === 'people') return;
    setSearching(true);
    setError('');
    try {
      const response = await catalogService.search(nextQuery);
      setResults(response.results.filter(movie => movie.poster_path).slice(0, 20));
    } catch {
      setError('Films could not be loaded.');
    } finally {
      setSearching(false);
    }
  };

  const visiblePeople = useMemo(() => {
    const term = (submittedQuery || query).trim().toLowerCase();
    if (!term) return people;
    return people.filter(person => person.username.toLowerCase().includes(term) || person.bio?.toLowerCase().includes(term) || person.latest_title?.toLowerCase().includes(term));
  }, [people, query, submittedQuery]);

  const switchView = (nextView: SearchView) => {
    setView(nextView);
    setQuery('');
    setSubmittedQuery('');
    setResults([]);
    setError('');
  };

  const toggleWantedFeeling = (feeling: keyof EmotionScores) => {
    setWantedFeelings(current => current.includes(feeling) ? current.filter(item => item !== feeling) : [...current, feeling]);
  };

  const findByFeeling = async (event: FormEvent) => {
    event.preventDefault();
    if (!wantedFeelings.length) return;
    const signal: EmotionScores = { neutral: 0, happy: 0, sad: 0, angry: 0, fearful: 0, disgusted: 0, surprised: 0 };
    wantedFeelings.forEach(feeling => { signal[feeling] = 1; });
    setFeelingSearching(true);
    setFeelingSearched(true);
    setFeelingError('');
    try {
      const response = await recommendationService.get(signal);
      const seen = new Set<number>();
      setFeelingResults([...response.forYou, ...response.adjacent].filter(movie => {
        if (!movie.recommended_by?.length || seen.has(movie.id)) return false;
        seen.add(movie.id);
        return true;
      }).slice(0, 12));
    } catch {
      setFeelingResults([]);
      setFeelingError('Films could not be loaded.');
    } finally {
      setFeelingSearching(false);
    }
  };

  const togglePerson = async (person: CommunityPerson) => {
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
    <div className="page-shell search-page">
      <div className="search-controls">
        <div className="search-switcher product-section-tabs" role="group" aria-label="Choose search type">
          <button aria-pressed={view === 'films'} onClick={() => switchView('films')} type="button">Films</button>
          <button aria-pressed={view === 'feelings'} onClick={() => switchView('feelings')} type="button">Feelings</button>
          <button aria-pressed={view === 'people'} onClick={() => switchView('people')} type="button">People</button>
        </div>

        {view !== 'feelings' && <form className="global-search" onSubmit={submit} role="search">
          <SearchIcon aria-hidden="true" size={18} />
          <input aria-label={`Search ${view}`} onChange={event => setQuery(event.target.value)} placeholder={view === 'films' ? 'Film title' : 'Name or username'} type="search" value={query} />
          <button disabled={!query.trim() || searching} type="submit">{searching ? 'Searching' : 'Search'}</button>
        </form>}
      </div>

      {error && <p className="error-text" role="alert">{error}</p>}

      {view === 'films' && (searching ? <div className="loading-state"><div className="loading-spinner" /></div> : submittedQuery ? (
        results.length ? <section aria-label={`Film results for ${submittedQuery}`} className="search-film-list">{results.map(movie => {
          const poster = imageUrl(movie.poster_path, 'w342');
          const saved = isSaved(movie.id);
          return (
            <article className="search-film" key={movie.id}>
              <Link to={`/movie/${movie.id}`}>{poster ? <img alt={`Poster for ${movie.title}`} loading="lazy" src={poster} /> : <span />}</Link>
              <div><Link to={`/movie/${movie.id}`}><h2>{movie.title}</h2></Link><p className="metadata">{releaseYear(movie.release_date)}</p><p>{movie.overview || 'No synopsis is available.'}</p><div className="search-film__actions"><Link className="text-link" to={`/movie/${movie.id}`}>Open film</Link><button aria-pressed={saved} onClick={() => void (saved ? unsaveFilm(movie.id) : saveFilm(movie.id))} type="button">{saved ? <Check size={15} /> : <Bookmark size={15} />}{saved ? 'Saved' : 'Save'}</button><Link to={`/log?movieId=${movie.id}`}>Add response</Link></div></div>
            </article>
          );
        })}</section> : <div className="product-empty"><p>No films found.</p></div>
      ) : loading ? <div className="loading-state"><div className="loading-spinner" /></div> : (
        <div className="search-start">
          {pulse.length > 0 && <section className="search-start__pulse" aria-label="Films with recent responses">
            <h1>Recent responses</h1>
            <div className="search-response-layout">
              <CommunityFilmCard film={pulse[0]} variant="feature" />
              <div className="search-response-index">
                {pulse.slice(1, 5).map(film => <CommunityFilmCard film={film} key={film.movie_id} variant="compact" />)}
              </div>
            </div>
          </section>}
          {savedFilms.length > 0 && <FilmRail description="Films you kept for later." movies={savedFilms.map(savedFilmMovie).slice(0, 10)} title="Saved films" />}
        </div>
      ))}

      {view === 'people' && (loading ? <div className="loading-state"><div className="loading-spinner" /></div> : visiblePeople.length ? (
        <section aria-label="People results" className="search-people-grid">
          {visiblePeople.map(person => (
            <article className="search-person" key={person.id}>
              <Link className="search-person__avatar" to={`/member/${person.username}`}>{person.username.charAt(0).toUpperCase()}</Link>
              <div><Link to={`/member/${person.username}`}><h2>@{person.username}</h2></Link><p>{person.bio || `${person.entries} responses.`}</p>{person.shared_film_title && <span>You both responded to <strong>{person.shared_film_title}</strong>.</span>}<div className="search-person__actions"><Link className="text-link" to={`/member/${person.username}`}>Open profile</Link><button aria-pressed={person.following} onClick={() => void togglePerson(person)} type="button">{person.following ? 'Following' : 'Follow'}</button></div></div>
            </article>
          ))}
        </section>
      ) : <div className="product-empty"><p>No people found.</p></div>)}

      {view === 'feelings' && (
        <section className="feeling-search" aria-labelledby="feeling-search-title">
          <form onSubmit={findByFeeling}>
            <div><h1 id="feeling-search-title">How do you want to feel?</h1><p>Choose one or more feelings. Results come from how connected people described their own viewings, not from genre.</p></div>
            <div aria-label="Choose feelings" className="feeling-search__options" role="group">
              {feelingKeys.map(feeling => <button aria-pressed={wantedFeelings.includes(feeling)} data-feeling={feeling} key={feeling} onClick={() => toggleWantedFeeling(feeling)} type="button">{emotionLabels[feeling]}</button>)}
            </div>
            <button className="button button--primary" disabled={!wantedFeelings.length || feelingSearching} type="submit">{feelingSearching ? 'Finding films' : 'Find films'}</button>
          </form>
          {feelingError && <p className="error-text" role="alert">{feelingError}</p>}
          {feelingSearching ? <div className="loading-state"><div className="loading-spinner" /><span>Finding films</span></div> : feelingSearched && feelingResults.length ? (
            <div className="feeling-search__results">
              <RecommendationSpotlight movie={feelingResults[0]} requestedFeelings={wantedFeelings} showAllLink={false} />
              {feelingResults.length > 1 && <section className="home-section" aria-labelledby="feeling-results-title"><header><h2 id="feeling-results-title">Recommended films</h2></header><div className="path-grid">{feelingResults.slice(1).map(movie => <DiscoveryPathCard key={movie.id} movie={movie} requestedFeelings={wantedFeelings} />)}</div></section>}
            </div>
          ) : feelingSearched ? <div className="product-empty"><p>No connected response matches those feelings yet.</p></div> : null}
        </section>
      )}
    </div>
  );
};

export default Search;
