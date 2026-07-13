import React, { useEffect, useMemo, useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { EmotionCapture } from '../components/EmotionCapture';
import FilmPoster from '../components/features/movie/FilmPoster';
import FilmRail from '../components/features/movie/FilmRail';
import { useDiary } from '../contexts/DiaryContext';
import { useUser } from '../contexts/UserContext';
import { catalogService } from '../services/catalogService';
import { RecommendationResponse, recommendationService } from '../services/recommendationService';
import { EmotionScores } from '../types/emotion';
import { Movie } from '../types/movie';

const humanEmotion = (key: keyof EmotionScores) => ({
  neutral: 'stillness', happy: 'joy', sad: 'melancholy', angry: 'friction', fearful: 'tension', disgusted: 'unease', surprised: 'wonder',
})[key];

const Recommendations: React.FC = () => {
  const { user } = useUser();
  const { currentSignal, setCurrentSignal } = useDiary();
  const [data, setData] = useState<RecommendationResponse | null>(null);
  const [query, setQuery] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [signalOpen, setSignalOpen] = useState(false);
  const [requestVersion, setRequestVersion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    recommendationService.get(currentSignal || undefined)
      .then(result => active && setData(result))
      .catch(() => active && setError('Recommendations could not be built right now. Try again shortly.'))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [currentSignal, requestVersion, user?.id]);

  useEffect(() => {
    if (!searchTerm) {
      setSearchResults([]);
      return;
    }
    let active = true;
    setLoading(true);
    catalogService.search(searchTerm)
      .then(response => active && setSearchResults(response.results.filter(movie => movie.poster_path)))
      .catch(() => active && setError('Film search could not be loaded.'))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [searchTerm]);

  const profileLine = useMemo(() => {
    if (!data) return '';
    const emotions = data.profile.dominantEmotions.slice(0, 2).map(item => humanEmotion(item.key));
    const genres = data.profile.topGenres.slice(0, 2).map(item => item.name);
    if (data.profile.historySize) return `Built from ${data.profile.historySize} diar${data.profile.historySize === 1 ? 'y entry' : 'y entries'}${emotions.length ? `, with the strongest pull toward ${emotions.join(' and ')}` : ''}${genres.length ? ` across ${genres.join(' and ')}` : ''}.`;
    if (currentSignal && emotions.length) return `This shelf is being shaped by ${emotions.join(' and ')}. It will become more personal as the diary grows.`;
    return 'A broad starting shelf. Add diary entries or set an emotional direction to change the ranking.';
  }, [currentSignal, data]);

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    setSearchTerm(query.trim());
  };

  const acceptSignal = (signal: EmotionScores) => {
    setCurrentSignal(signal);
    setSignalOpen(false);
  };

  return (
    <div className="page-shell recommendation-page">
      <header className="page-header page-header--recommendations">
        <div className="page-header__copy">
          <h1 className="page-title">{searchTerm ? `Results for “${searchTerm}”` : user ? 'For you, from your diary.' : 'Find the emotional shape first.'}</h1>
          <p className="page-intro">{searchTerm ? 'Search the catalog directly.' : profileLine}</p>
        </div>
        {!searchTerm && (
          <button className="button button--secondary" onClick={() => setSignalOpen(open => !open)} type="button">
            {signalOpen ? <X size={18} /> : <SlidersHorizontal size={18} />}{signalOpen ? 'Close emotional direction' : currentSignal ? 'Change emotional direction' : 'Set an emotional direction'}
          </button>
        )}
      </header>

      {!searchTerm && data && (
        <section className="recommendation-origin" aria-label="How these recommendations were shaped">
          <div className="recommendation-origin__copy">
            <strong>{data.profile.historySize ? 'Built from your record' : currentSignal ? 'Shaped for this visit' : 'A starting shelf'}</strong>
            <p>{profileLine}</p>
          </div>
          <div className="recommendation-origin__signals" aria-label="Recommendation inputs">
            {data.profile.historySize > 0 && <span>{data.profile.historySize} diary {data.profile.historySize === 1 ? 'entry' : 'entries'}</span>}
            {data.profile.dominantEmotions.slice(0, 2).map(item => <span key={item.key}>{humanEmotion(item.key)}</span>)}
            {data.profile.topGenres.slice(0, 2).map(item => <span key={item.id}>{item.name}</span>)}
            {currentSignal && <span>temporary direction active</span>}
          </div>
        </section>
      )}

      {signalOpen && (
        <section className="signal-panel" aria-label="Emotional discovery direction">
          <div className="signal-panel__intro"><h2>What kind of emotional pull are you looking for?</h2><p>Set it directly. Optional inputs can suggest a mix for you to review. This shifts the current results without replacing your diary history.</p></div>
          <EmotionCapture onCancel={() => setSignalOpen(false)} onEmotionsDetected={acceptSignal} />
        </section>
      )}

      <form className="search-bar" onSubmit={submitSearch} role="search">
        <Search aria-hidden="true" size={20} />
        <input aria-label="Search films" className="input" onChange={event => setQuery(event.target.value)} placeholder="Search by film title" type="search" value={query} />
        <button className="button button--quiet" type="submit">Search films</button>
      </form>

      {searchTerm && <button className="text-link search-reset" onClick={() => { setSearchTerm(''); setQuery(''); }} type="button">Return to recommendations</button>}

      {loading ? (
        <div className="loading-state"><div className="loading-spinner" /><span>{searchTerm ? 'Searching films' : 'Reading your diary pattern'}</span></div>
      ) : error ? (
        <div className="error-state"><p>{error}</p><button className="button button--secondary" onClick={() => setRequestVersion(version => version + 1)} type="button">Try again</button></div>
      ) : searchTerm ? (
        searchResults.length ? <div className="poster-grid">{searchResults.map(movie => <FilmPoster key={movie.id} movie={movie} />)}</div> : <div className="empty-state"><h2>No films found</h2><p>Try another title.</p></div>
      ) : data ? (
        <div className="recommendation-lanes">
          <FilmRail description="The closest fit across your emotional and film patterns." movies={data.forYou} title={user ? 'Closest to your record' : 'A place to begin'} />
          {data.adjacent.length > 0 && <FilmRail description="Connected to the pattern, with one part of it moved sideways." movies={data.adjacent} title="A little outside it" />}
          {data.community.length > 0 && <FilmRail description="Films that appear in public diaries beyond your own." movies={data.community} title="Shared by nearby taste" />}
        </div>
      ) : null}
    </div>
  );
};

export default Recommendations;
