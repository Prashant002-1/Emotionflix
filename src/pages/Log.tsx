import React, { useEffect, useState } from 'react';
import { ArrowLeft, Check, Search, Star } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { EmotionCapture } from '../components/EmotionCapture';
import { useDiary } from '../contexts/DiaryContext';
import { catalogService } from '../services/catalogService';
import { CaptureMethod, DiaryVisibility } from '../types/diary';
import { EmotionScores } from '../types/emotion';
import { Movie } from '../types/movie';
import { imageUrl, releaseYear } from '../utils/display';

type Step = 'search' | 'entry' | 'done';

const Log: React.FC = () => {
  const { createEntry } = useDiary();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<Step>('search');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Movie[]>([]);
  const [selected, setSelected] = useState<Movie | null>(null);
  const [rating, setRating] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [watchedOn, setWatchedOn] = useState(new Date().toISOString().slice(0, 10));
  const [visibility, setVisibility] = useState<DiaryVisibility>('private');
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const movieId = Number(searchParams.get('movieId'));
    if (!movieId) return;
    catalogService.movie(movieId)
      .then(movie => { setSelected(movie); setStep('entry'); })
      .catch(() => setError('That film could not be loaded. Search for it below.'));
  }, [searchParams]);

  const search = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setError('');
    try {
      const response = await catalogService.search(query.trim());
      setResults(response.results.filter(movie => movie.poster_path).slice(0, 10));
    } catch {
      setError('Film search could not be loaded right now. Try again shortly.');
    } finally {
      setSearching(false);
    }
  };

  const chooseMovie = (movie: Movie) => {
    setSelected(movie);
    setStep('entry');
    setError('');
  };

  const save = async (emotions: EmotionScores, method: CaptureMethod, confidence = 1) => {
    if (!selected) return;
    setSaving(true);
    setError('');
    try {
      await createEntry({
        movieId: selected.id,
        watchedOn,
        rating,
        note,
        visibility,
        emotions,
        captureMethod: method,
        confidence,
      });
      setStep('done');
    } catch {
      setError('The diary entry could not be saved. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setStep('search');
    setSelected(null);
    setRating(null);
    setNote('');
    setWatchedOn(new Date().toISOString().slice(0, 10));
    setVisibility('private');
    setQuery('');
    setResults([]);
    setError('');
  };

  return (
    <div className="page-shell log-page">
      <header className="page-header">
        <div className="page-header__copy">
          <h1 className="page-title">{step === 'search' ? 'Add a film to your diary.' : step === 'entry' ? `What did ${selected?.title} leave behind?` : 'Entry saved.'}</h1>
          <p className="page-intro">{step === 'search' ? 'Start with the film. The date, rating, note, and emotional record stay together.' : step === 'entry' ? 'Write what stayed with you, then set or refine the emotional mix yourself. Optional inputs can offer a suggestion, but you decide what is saved.' : 'This viewing can now shape future recommendations.'}</p>
        </div>
      </header>

      {error && <div className="notice notice--error" role="alert">{error}</div>}

      {step === 'search' && (
        <>
          <form className="search-bar" id="film-search-form" onSubmit={search} role="search">
            <Search aria-hidden="true" size={20} />
            <input aria-label="Search for a film to log" className="input" onChange={event => setQuery(event.target.value)} placeholder="Search by film title" type="search" value={query} />
            <button className="button button--primary" disabled={searching || !query.trim()} type="submit"><Search size={17} />{searching ? 'Searching' : 'Search films'}</button>
          </form>
          {searching && <div className="loading-state"><div className="loading-spinner" /><span>Searching films</span></div>}
          {!searching && results.length > 0 && (
            <div className="film-picker">
              {results.map(movie => (
                <button className="film-picker__row" key={movie.id} onClick={() => chooseMovie(movie)} type="button">
                  {imageUrl(movie.poster_path, 'w154') ? <img alt="" aria-hidden="true" src={imageUrl(movie.poster_path, 'w154')!} /> : <div className="film-picker__placeholder" />}
                  <span><strong>{movie.title}</strong><small>{releaseYear(movie.release_date)} · {movie.vote_average.toFixed(1)} community rating</small></span>
                  <span className="text-link">Choose film</span>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {step === 'entry' && selected && (
        <div className="entry-composer">
          <aside className="entry-composer__film">
            {imageUrl(selected.poster_path, 'w342') && <img alt={`Poster for ${selected.title}`} src={imageUrl(selected.poster_path, 'w342')!} />}
            <div><h2>{selected.title}</h2><p>{releaseYear(selected.release_date)}</p></div>
            <button className="button button--quiet" onClick={() => setStep('search')} type="button"><ArrowLeft size={17} />Choose another film</button>
          </aside>

          <div className="entry-composer__record">
            <div className="entry-fields">
              <div className="field"><label htmlFor="watched-on">Watched on</label><input id="watched-on" onChange={event => setWatchedOn(event.target.value)} type="date" value={watchedOn} /></div>
              <div className="field"><label htmlFor="film-rating"><Star size={15} />Rating</label><select id="film-rating" onChange={event => setRating(event.target.value ? Number(event.target.value) : null)} value={rating ?? ''}><option value="">No rating</option>{Array.from({ length: 10 }, (_, index) => (index + 1) / 2).map(value => <option key={value} value={value}>{value.toFixed(1)} / 5</option>)}</select></div>
              <div className="field field--full"><label htmlFor="entry-note">What stayed with you?</label><textarea id="entry-note" maxLength={2000} onChange={event => setNote(event.target.value)} placeholder="A scene, a feeling, a thought you kept returning to." value={note} /><span className="field__hint">{note.length} / 2000</span></div>
              <fieldset className="visibility-control field--full"><legend>Visibility</legend><label><input checked={visibility === 'private'} name="visibility" onChange={() => setVisibility('private')} type="radio" />Private</label><label><input checked={visibility === 'public'} name="visibility" onChange={() => setVisibility('public')} type="radio" />Public</label><p>Public entries can appear in community discovery.</p></fieldset>
            </div>

            <div className="feeling-divider"><span>Emotional record</span><p>This is the pattern the recommendation engine learns from.</p></div>
            <EmotionCapture isLoading={saving} onEmotionsDetected={save} />
          </div>
        </div>
      )}

      {step === 'done' && selected && (
        <div className="completion-state">
          <Check size={32} />
          <div><h2>{selected.title} is in your diary.</h2><p>The film, your note, and the emotional record were saved together.</p></div>
          <div className="completion-state__actions"><Link className="button button--primary" to="/diary">Open your diary</Link><Link className="button button--secondary" to="/recommendations">See updated recommendations</Link><button className="button button--quiet" onClick={reset} type="button">Log another film</button></div>
        </div>
      )}
    </div>
  );
};

export default Log;
