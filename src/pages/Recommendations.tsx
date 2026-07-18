import React, { useEffect, useState } from 'react';
import { ArrowLeft, Search, SlidersHorizontal, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import ManualEmotionInput from '../components/features/emotion/ManualEmotionInput';
import FilmPoster from '../components/features/movie/FilmPoster';
import FilmRail from '../components/features/movie/FilmRail';
import { DiscoveryPathCard } from '../components/recommendations/DiscoveryPathCard';
import { RecommendationSpotlight } from '../components/recommendations/RecommendationSpotlight';
import { useDiary } from '../contexts/DiaryContext';
import { catalogService } from '../services/catalogService';
import { RecommendationResponse, recommendationService } from '../services/recommendationService';
import { EmotionScores } from '../types/emotion';
import { Movie } from '../types/movie';
import { emotionLabels } from '../utils/display';

const Recommendations: React.FC = () => {
  const { currentSignal, setCurrentSignal } = useDiary();
  const [data, setData] = useState<RecommendationResponse | null>(null);
  const [browseFilms, setBrowseFilms] = useState<Movie[]>([]);
  const [query, setQuery] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [view, setView] = useState<'recommendations' | 'search'>('recommendations');
  const [signalOpen, setSignalOpen] = useState(false);
  const [requestVersion, setRequestVersion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [browseLoading, setBrowseLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [browseError, setBrowseError] = useState('');
  const [searchError, setSearchError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    recommendationService.get(currentSignal || undefined)
      .then(recommendations => active && setData(recommendations))
      .catch(() => active && setError('Recommendations could not be loaded.'))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [currentSignal, requestVersion]);

  useEffect(() => {
    let active = true;
    setBrowseLoading(true);
    setBrowseError('');
    catalogService.trending()
      .then(browse => active && setBrowseFilms(browse.results.filter(movie => movie.poster_path).slice(0, 18)))
      .catch(() => active && setBrowseError('Films could not be loaded.'))
      .finally(() => active && setBrowseLoading(false));
    return () => { active = false; };
  }, []);

  const submitSearch = async (event: React.FormEvent) => {
    event.preventDefault();
    const next = query.trim();
    if (!next) return;
    setSearchTerm(next);
    setSearchResults([]);
    setSearching(true);
    setSearchError('');
    try {
      const response = await catalogService.search(next);
      setSearchResults(response.results.filter(movie => movie.poster_path));
    } catch {
      setSearchError('Film search could not be loaded.');
    } finally {
      setSearching(false);
    }
  };

  const acceptSignal = (signal: EmotionScores) => {
    setCurrentSignal(signal);
    setSignalOpen(false);
  };

  const selectedFeelingKeys = currentSignal
    ? (Object.entries(currentSignal) as [keyof EmotionScores, number][])
      .filter(([, value]) => value > 0)
      .sort(([, left], [, right]) => right - left)
      .slice(0, 3)
      .map(([key]) => key)
    : [];
  const selectedFeelings = selectedFeelingKeys.map(key => emotionLabels[key]);
  const leadRecommendation = data?.forYou.find(movie => movie.recommended_by?.length);
  const remainingRecommendations = leadRecommendation
    ? data?.forYou.filter(movie => movie.id !== leadRecommendation.id) || []
    : [];
  const otherRecommendations = [...new Map([...remainingRecommendations, ...(data?.adjacent || [])]
    .filter(movie => movie.recommended_by?.length)
    .map(movie => [movie.id, movie])).values()];

  return (
    <div className="page-shell recommendation-page">
      <header className="recommendations-header recommendations-header--quiet">
        <Link aria-label="Return home" className="icon-button" to="/feed"><ArrowLeft size={19} /></Link>
        <div className="recommendations-header__actions">
          <div aria-label="Choose recommendation view" className="product-section-tabs" role="group">
            <button aria-pressed={view === 'recommendations'} onClick={() => setView('recommendations')} type="button">For you</button>
            <button aria-pressed={view === 'search'} onClick={() => { setSignalOpen(false); setView('search'); }} type="button">Search films</button>
          </div>
          {view === 'recommendations' && (
            <button className="button button--secondary" onClick={() => setSignalOpen(open => !open)} type="button">
              {signalOpen ? <X aria-hidden="true" size={18} /> : <SlidersHorizontal aria-hidden="true" size={18} />}
              {signalOpen ? 'Close' : selectedFeelings.length ? selectedFeelings.join(', ') : 'Choose a feeling'}
            </button>
          )}
        </div>
      </header>

      {view === 'recommendations' && selectedFeelings.length > 0 && !signalOpen && (
        <div className="recommendation-intent">
          <span>What you want to feel</span>
          <strong>{selectedFeelings.join(', ')}</strong>
          <button onClick={() => setCurrentSignal(null)} type="button">Clear</button>
        </div>
      )}

      {view === 'recommendations' && signalOpen && (
        <section className="signal-panel" aria-label="Choose what you want to feel">
          <ManualEmotionInput
            description="Choose one or more feelings. Results come from how connected people described their own viewings, not from genre."
            heading="What do you want to feel?"
            onSubmit={acceptSignal}
            showSubmitButton
            submitLabel="Use these feelings"
          />
        </section>
      )}

      {view === 'recommendations' && (loading ? (
        <div className="loading-state"><div className="loading-spinner" /><span>Finding recommendations</span></div>
      ) : error && !data ? (
        <div className="error-state"><p>{error}</p><button className="button button--secondary" onClick={() => setRequestVersion(version => version + 1)} type="button">Try again</button></div>
      ) : data && leadRecommendation ? (
        <div className="recommendation-story" data-reveal>
          <RecommendationSpotlight movie={leadRecommendation} requestedFeelings={selectedFeelingKeys} showAllLink={false} />
          {otherRecommendations.length > 0 && <section className="home-section" aria-labelledby="other-recommendations-title"><header><h2 id="other-recommendations-title">Recommended films</h2></header><div className="path-grid">{otherRecommendations.map(movie => <DiscoveryPathCard key={movie.id} movie={movie} requestedFeelings={selectedFeelingKeys} />)}</div></section>}
        </div>
      ) : data ? (
        <div className="recommendation-cold-start">
          <section className="product-empty">
            <h2>Recommendations need a shared film.</h2>
            <p>Add how a film felt. When someone else responded to the same film, their other responses can become recommendations.</p>
            <div className="product-empty__actions">
              <Link className="button button--primary" to="/log">Add a response</Link>
              <button className="text-link" onClick={() => setView('search')} type="button">Search films</button>
            </div>
          </section>
          {data.community.length > 0 && <FilmRail movies={data.community} title="What is moving through the community" />}
        </div>
      ) : null)}

      {view === 'search' && <section className="recommendation-search" aria-label="Film search">
        <form className="search-bar" onSubmit={submitSearch} role="search">
          <Search aria-hidden="true" size={20} />
          <input aria-label="Search films" className="input" onChange={event => setQuery(event.target.value)} placeholder="Search by title" type="search" value={query} />
          <button className="button button--quiet" disabled={!query.trim() || searching} type="submit">{searching ? 'Searching' : 'Search'}</button>
        </form>
        {searchError && <p className="error-text" role="alert">{searchError}</p>}
        {searchTerm ? (
          <>
            <button className="text-link search-reset" onClick={() => { setSearchTerm(''); setQuery(''); setSearchResults([]); setSearchError(''); }} type="button">Clear search</button>
            {searching ? <div className="loading-state"><div className="loading-spinner" /></div> : searchResults.length ? <div className="poster-grid">{searchResults.map(movie => <FilmPoster key={movie.id} movie={movie} />)}</div> : <div className="empty-state"><h3>No films found</h3></div>}
          </>
        ) : browseLoading ? (
          <div className="loading-state" role="status"><div className="loading-spinner" /><span>Loading films</span></div>
        ) : browseError ? (
          <div className="product-empty"><p>{browseError}</p></div>
        ) : browseFilms.length ? <FilmRail movies={browseFilms} title="Films people are watching" /> : (
          <div className="product-empty"><p>No films found.</p></div>
        )}
      </section>}
    </div>
  );
};

export default Recommendations;
