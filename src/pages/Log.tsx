import React, { useEffect, useState } from 'react';
import { ArrowLeft, Check, ImagePlus, Search, X } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { EmotionCapture } from '../components/EmotionCapture';
import { useDiary } from '../contexts/DiaryContext';
import { catalogService } from '../services/catalogService';
import { CaptureMethod, DiaryVisibility } from '../types/diary';
import { EmotionScores } from '../types/emotion';
import { Movie } from '../types/movie';
import { imageUrl, releaseYear } from '../utils/display';

type Step = 'search' | 'entry' | 'done';

const prepareExpressionPhoto = async (file: File): Promise<string> => {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Choose a JPEG, PNG, or WebP image.');
  if (file.size > 8 * 1024 * 1024) throw new Error('Choose an image smaller than 8 MB.');

  const source = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('The image could not be read.'));
    reader.readAsDataURL(file);
  });
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const next = new window.Image();
    next.onload = () => resolve(next);
    next.onerror = () => reject(new Error('The image could not be opened.'));
    next.src = source;
  });
  const scale = Math.min(1, 1200 / image.naturalWidth, 1500 / image.naturalHeight);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext('2d');
  if (!context) throw new Error('The image could not be prepared.');
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.82);
};

const Log: React.FC = () => {
  const { createEntry } = useDiary();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<Step>('search');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Movie[]>([]);
  const [selected, setSelected] = useState<Movie | null>(null);
  const [note, setNote] = useState('');
  const [watchedOn, setWatchedOn] = useState(new Date().toISOString().slice(0, 10));
  const [visibility, setVisibility] = useState<DiaryVisibility>('private');
  const [expressionImage, setExpressionImage] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState('');
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

  const chooseExpressionPhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setPhotoError('');
    try {
      setExpressionImage(await prepareExpressionPhoto(file));
    } catch (caught) {
      setPhotoError(caught instanceof Error ? caught.message : 'The image could not be prepared.');
    }
  };

  const save = async (emotions: EmotionScores, method: CaptureMethod, confidence = 1, analyzedExpressionImage?: string) => {
    if (!selected) return;
    setSaving(true);
    setError('');
    try {
      await createEntry({
        movieId: selected.id,
        watchedOn,
        note,
        expressionImage: analyzedExpressionImage || expressionImage || undefined,
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
    setNote('');
    setWatchedOn(new Date().toISOString().slice(0, 10));
    setVisibility('private');
    setExpressionImage(null);
    setPhotoError('');
    setQuery('');
    setResults([]);
    setError('');
  };

  return (
    <div className="page-shell log-page">
      <header className="page-header">
        <div className="page-header__copy">
          <h1 className="page-title">{step === 'search' ? 'Choose a film.' : step === 'entry' ? `How did ${selected?.title} make you feel?` : 'Response saved.'}</h1>
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
                  <span><strong>{movie.title}</strong><small>{releaseYear(movie.release_date)}</small></span>
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
              <div className="field field--full"><label htmlFor="entry-note">What did it mean to you?</label><textarea id="entry-note" maxLength={2000} onChange={event => setNote(event.target.value)} placeholder="I felt..." value={note} /><span className="field__hint">{note.length} / 2000</span></div>
              <div className="field field--full">
                <span className="field-label">Add a photo <small>Optional</small></span>
                {expressionImage ? (
                  <figure className="expression-photo-preview">
                    <img alt="Optional expression photo preview" src={expressionImage} />
                    <button aria-label="Remove attached photo" className="icon-button" onClick={() => setExpressionImage(null)} type="button"><X size={18} /></button>
                  </figure>
                ) : (
                  <label className="expression-photo-picker">
                    <ImagePlus aria-hidden="true" size={22} />
                    <span><strong>Choose a photo</strong><small>Share the expression that stayed with you. Your feelings still come from you.</small></span>
                    <input accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={chooseExpressionPhoto} type="file" />
                  </label>
                )}
                {photoError && <span className="error-text" role="alert">{photoError}</span>}
              </div>
              <fieldset className="visibility-control field--full"><legend>Visibility</legend><label><input checked={visibility === 'private'} name="visibility" onChange={() => setVisibility('private')} type="radio" />Private</label><label><input checked={visibility === 'public'} name="visibility" onChange={() => setVisibility('public')} type="radio" />Public</label><p>Public responses appear in community activity.</p></fieldset>
            </div>

            <div className="feeling-divider"><span>Add your feelings</span></div>
            <EmotionCapture isLoading={saving} onEmotionsDetected={save} />
          </div>
        </div>
      )}

      {step === 'done' && selected && (
        <div className="completion-state">
          <Check size={32} />
          <div><h2>{selected.title} is in your diary.</h2></div>
          <div className="completion-state__actions"><Link className="button button--primary" to="/feed">Go home</Link><Link className="button button--secondary" to="/recommendations">Discover films</Link><button className="button button--quiet" onClick={reset} type="button">Add another film</button></div>
        </div>
      )}
    </div>
  );
};

export default Log;
