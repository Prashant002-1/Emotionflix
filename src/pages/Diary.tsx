import React, { useState } from 'react';
import { Eye, EyeOff, Pencil, Plus, Star, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import FilmRail from '../components/features/movie/FilmRail';
import DiaryEntryEditor from '../components/diary/DiaryEntryEditor';
import { useDiary } from '../contexts/DiaryContext';
import { EmotionScores } from '../types/emotion';
import { savedFilmMovie } from '../types/diary';
import { dominantEmotion, emotionColors, imageUrl, releaseYear } from '../utils/display';

const feelingName = (key: keyof EmotionScores) => ({
  neutral: 'Stillness', happy: 'Joy', sad: 'Melancholy', angry: 'Friction', fearful: 'Tension', disgusted: 'Unease', surprised: 'Wonder',
})[key];

const Diary: React.FC = () => {
  const { entries, savedFilms, summary, loading, removeEntry, updateEntry } = useDiary();
  const [editingId, setEditingId] = useState<number | null>(null);

  if (loading && !entries.length) return <div className="loading-state page-loading"><div className="loading-spinner" /><span>Opening your diary</span></div>;

  const summaryEmotion = summary ? dominantEmotion(summary) : null;

  return (
    <div className="page-shell diary-page">
      <header className="page-header diary-header">
        <div className="page-header__copy"><h1 className="page-title">Your film diary.</h1><p className="page-intro">A record of what you watched, what it left behind, and the patterns forming between films.</p></div>
        <Link className="button button--primary" to="/log"><Plus size={18} />Log a film</Link>
      </header>

      {summary && summary.entries > 0 && (
        <section className="diary-pattern" aria-labelledby="pattern-title">
          <div><h2 id="pattern-title">The pattern so far</h2><p>{summary.entries} {summary.entries === 1 ? 'entry' : 'entries'} · {summary.public_entries} public · {summary.saved} saved</p></div>
          <dl>
            <div><dt>Strongest trace</dt><dd>{summaryEmotion ? feelingName(summaryEmotion.emotion) : 'Still forming'}</dd></div>
            <div><dt>Recurring genres</dt><dd>{summary.top_genres.slice(0, 3).map(genre => genre.name).join(', ') || 'Still forming'}</dd></div>
            <div><dt>Average rating</dt><dd>{summary.average_rating ? `${summary.average_rating} / 5` : 'No ratings yet'}</dd></div>
          </dl>
          <div className="emotion-spectrum" aria-label="Average emotional pattern">
            {(Object.keys(emotionColors) as (keyof EmotionScores)[]).map(key => {
              const value = Number(summary[key]) || 0;
              return <span key={key} style={{ background: emotionColors[key], flexGrow: Math.max(value, 0.015) }} title={`${feelingName(key)} ${Math.round(value * 100)}%`} />;
            })}
          </div>
        </section>
      )}

      {entries.length ? (
        <section className="diary-list" aria-labelledby="entries-title">
          <header className="section-heading-row"><div><h2 id="entries-title">Entries</h2><p>Newest viewing first.</p></div></header>
          {entries.map(entry => {
            const emotion = dominantEmotion(entry);
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
                      <div className="diary-entry__topline"><p>{new Date(`${entry.watched_on}T12:00:00`).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</p><span>{entry.visibility === 'public' ? <Eye size={15} /> : <EyeOff size={15} />}{entry.visibility}</span></div>
                      <Link to={`/movie/${entry.movie_id}`}><h3>{entry.title}</h3></Link>
                      <div className="diary-entry__facts">
                        <span>{releaseYear(entry.release_date)}</span>
                        {entry.rating && <span><Star size={15} />{entry.rating} / 5</span>}
                        {emotion && <span><i style={{ background: emotionColors[emotion.emotion] }} />{feelingName(emotion.emotion)}</span>}
                      </div>
                      {entry.note ? <blockquote>{entry.note}</blockquote> : <p className="diary-entry__empty-note">No note on this viewing.</p>}
                    </>
                  )}
                </div>
                {editingId !== entry.id && <div className="diary-entry__actions"><button aria-label={`Edit diary entry for ${entry.title}`} className="icon-button" onClick={() => setEditingId(entry.id)} type="button"><Pencil size={18} /></button><button aria-label={`Delete diary entry for ${entry.title}`} className="icon-button" onClick={() => { if (window.confirm(`Delete the diary entry for ${entry.title}?`)) void removeEntry(entry.id); }} type="button"><Trash2 size={18} /></button></div>}
              </article>
            );
          })}
        </section>
      ) : (
        <section className="diary-first-entry"><h2>Your diary is empty.</h2><p>Start with the last film that stayed with you. Add the date, your words, and the feeling it left behind.</p><Link className="button button--primary" to="/log">Log your first film</Link></section>
      )}

      {savedFilms.length > 0 && <div className="diary-saved"><FilmRail description="Films you kept for later." movies={savedFilms.map(savedFilmMovie)} title="Saved films" /></div>}
    </div>
  );
};

export default Diary;
