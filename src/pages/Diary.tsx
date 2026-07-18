import React, { useMemo, useState } from 'react';
import { Eye, EyeOff, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import FilmRail from '../components/features/movie/FilmRail';
import DiaryEntryEditor from '../components/diary/DiaryEntryEditor';
import { useDiary } from '../contexts/DiaryContext';
import { EmotionScores } from '../types/emotion';
import { savedFilmMovie } from '../types/diary';
import { calendarDate, dominantEmotion, emotionColors, emotionLabels, formatCalendarDate, imageUrl, releaseYear } from '../utils/display';

const feelingName = (key: keyof EmotionScores) => ({
  neutral: 'Stillness', happy: 'Joy', sad: 'Melancholy', angry: 'Friction', fearful: 'Tension', disgusted: 'Unease', surprised: 'Wonder',
})[key];

const Diary: React.FC = () => {
  const { entries, savedFilms, loading, removeEntry, updateEntry } = useDiary();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [view, setView] = useState<'entries' | 'saved'>('entries');
  const [query, setQuery] = useState('');
  const [visibility, setVisibility] = useState<'all' | 'public' | 'private'>('all');

  const filteredEntries = useMemo(() => entries.filter(entry => {
    const matchesVisibility = visibility === 'all' || entry.visibility === visibility;
    const term = query.trim().toLowerCase();
    const matchesQuery = !term || entry.title.toLowerCase().includes(term) || entry.note.toLowerCase().includes(term);
    return matchesVisibility && matchesQuery;
  }), [entries, query, visibility]);

  const groupedEntries = useMemo(() => {
    const groups = new Map<string, typeof filteredEntries>();
    filteredEntries.forEach(entry => {
      const year = calendarDate(entry.watched_on)?.getFullYear().toString() || 'Date unknown';
      groups.set(year, [...(groups.get(year) || []), entry]);
    });
    return [...groups.entries()];
  }, [filteredEntries]);

  const recentFeelings = useMemo(() => {
    const keys = Object.keys(emotionLabels) as (keyof EmotionScores)[];
    const totals: EmotionScores = {
      neutral: 0,
      happy: 0,
      sad: 0,
      angry: 0,
      fearful: 0,
      disgusted: 0,
      surprised: 0,
    };
    entries.slice(0, 10).forEach(entry => keys.forEach(key => { totals[key] += Number(entry[key]) || 0; }));
    return keys.map(key => ({ key, value: totals[key] })).filter(item => item.value > 0).sort((left, right) => right.value - left.value).slice(0, 4);
  }, [entries]);

  const rewatchCount = useMemo(() => {
    const counts = new Map<number, number>();
    entries.forEach(entry => counts.set(entry.movie_id, (counts.get(entry.movie_id) || 0) + 1));
    return [...counts.values()].reduce((total, count) => total + Math.max(0, count - 1), 0);
  }, [entries]);

  if (loading && !entries.length) return <div className="loading-state page-loading"><div className="loading-spinner" /><span>Opening your diary</span></div>;

  return (
    <div className="page-shell diary-page">
      <header className="page-header diary-header">
        <div className="diary-header__actions">
          <div aria-label="Choose diary view" className="product-section-tabs" role="group">
            <button aria-pressed={view === 'entries'} onClick={() => setView('entries')} type="button">Entries</button>
            <button aria-pressed={view === 'saved'} onClick={() => setView('saved')} type="button">Saved</button>
          </div>
          <Link aria-label="Add a response" className="diary-add" to="/log"><Plus size={19} /></Link>
        </div>
      </header>

      {view === 'entries' && (entries.length ? (
        <>
          <section className="diary-overview" aria-label="Recent diary summary">
            <div className="diary-overview__feelings"><span>Last {Math.min(entries.length, 10)} viewings</span><strong>{recentFeelings.map(item => emotionLabels[item.key]).join(' · ')}</strong><div aria-hidden="true">{recentFeelings.map(item => <i key={item.key} style={{ background: emotionColors[item.key], flexGrow: Math.max(item.value, 0.1) }} />)}</div></div>
            <dl><div><dt>Responses</dt><dd>{entries.length}</dd></div><div><dt>Public</dt><dd>{entries.filter(entry => entry.visibility === 'public').length}</dd></div><div><dt>Rewatches</dt><dd>{rewatchCount}</dd></div><div><dt>Saved</dt><dd>{savedFilms.length}</dd></div></dl>
          </section>

          <div className="diary-tools">
            <label><Search aria-hidden="true" size={17} /><input aria-label="Search your diary" onChange={event => setQuery(event.target.value)} placeholder="Search films or your words" type="search" value={query} /></label>
            <div aria-label="Filter diary visibility" className="product-section-tabs" role="group"><button aria-pressed={visibility === 'all'} onClick={() => setVisibility('all')} type="button">All</button><button aria-pressed={visibility === 'public'} onClick={() => setVisibility('public')} type="button">Public</button><button aria-pressed={visibility === 'private'} onClick={() => setVisibility('private')} type="button">Private</button></div>
          </div>

          {groupedEntries.length ? groupedEntries.map(([year, yearEntries]) => <section className="diary-year" aria-labelledby={`diary-${year}`} key={year}><h2 id={`diary-${year}`}>{year}</h2><div className="diary-list">{yearEntries.map(entry => {
            const emotion = dominantEmotion(entry);
            const viewings = entries.filter(item => item.movie_id === entry.movie_id).length;
            return (
              <article className="diary-entry" key={entry.id}>
                <Link className="diary-entry__poster" to={`/movie/${entry.movie_id}`}>
                  {imageUrl(entry.poster_path, 'w342') ? <img alt={`Poster for ${entry.title}`} loading="lazy" src={imageUrl(entry.poster_path, 'w342')!} /> : <div />}
                </Link>
                <div className="diary-entry__body">
                  {editingId === entry.id ? (
                    <DiaryEntryEditor entry={entry} onCancel={() => setEditingId(null)} onSave={async changes => { await updateEntry(entry.id, changes); setEditingId(null); }} />
                  ) : (
                    <>
                      <div className="diary-entry__topline"><p>{formatCalendarDate(entry.watched_on, { month: 'long', day: 'numeric', year: 'numeric' })}</p><span>{entry.visibility === 'public' ? <Eye size={15} /> : <EyeOff size={15} />}{entry.visibility}</span></div>
                      <Link to={`/movie/${entry.movie_id}`}><h3>{entry.title}</h3></Link>
                      <div className="diary-entry__facts">
                        <span>{releaseYear(entry.release_date)}</span>
                        {emotion && <span><i style={{ background: emotionColors[emotion.emotion] }} />{feelingName(emotion.emotion)}</span>}
                        {viewings > 1 && <span>{viewings} viewings</span>}
                      </div>
                      {entry.expression_image_path && <img alt={entry.expression_image_alt || 'Expression photo attached to this response'} className="diary-entry__expression" loading="lazy" src={entry.expression_image_path} />}
                      {entry.note ? <blockquote>{entry.note}</blockquote> : <p className="diary-entry__empty-note">No note on this viewing.</p>}
                    </>
                  )}
                </div>
                {editingId !== entry.id && <div className="diary-entry__actions"><button aria-label={`Edit diary entry for ${entry.title}`} className="icon-button" onClick={() => setEditingId(entry.id)} type="button"><Pencil size={18} /></button><button aria-label={`Delete diary entry for ${entry.title}`} className="icon-button" onClick={() => { if (window.confirm(`Delete the diary entry for ${entry.title}?`)) void removeEntry(entry.id); }} type="button"><Trash2 size={18} /></button></div>}
              </article>
            );
          })}</div></section>) : <div className="product-empty"><p>No responses match this search.</p><button className="text-link" onClick={() => { setQuery(''); setVisibility('all'); }} type="button">Clear filters</button></div>}
        </>
      ) : (
        <section className="diary-first-entry"><h2>Your diary is empty.</h2><p>Start with the last film that moved you.</p><Link className="button button--primary" to="/log">Add first response</Link></section>
      ))}

      {view === 'saved' && (savedFilms.length > 0
        ? <div className="diary-saved"><FilmRail movies={savedFilms.map(savedFilmMovie)} /></div>
        : <div className="product-empty"><p>No saved films yet.</p><Link className="text-link" to="/feed">Return home</Link></div>)}
    </div>
  );
};

export default Diary;
