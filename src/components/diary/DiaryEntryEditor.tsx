import React, { useState } from 'react';
import ManualEmotionInput from '../features/emotion/ManualEmotionInput';
import { DiaryEntry, DiaryEntryInput, DiaryVisibility } from '../../types/diary';
import { EmotionScores } from '../../types/emotion';

interface DiaryEntryEditorProps {
  entry: DiaryEntry;
  onCancel: () => void;
  onSave: (changes: Partial<Omit<DiaryEntryInput, 'movieId'>>) => Promise<void>;
}

const DiaryEntryEditor: React.FC<DiaryEntryEditorProps> = ({ entry, onCancel, onSave }) => {
  const [watchedOn, setWatchedOn] = useState(entry.watched_on.slice(0, 10));
  const [note, setNote] = useState(entry.note);
  const [visibility, setVisibility] = useState<DiaryVisibility>(entry.visibility);
  const [emotions, setEmotions] = useState<EmotionScores>({
    neutral: entry.neutral,
    happy: entry.happy,
    sad: entry.sad,
    angry: entry.angry,
    fearful: entry.fearful,
    disgusted: entry.disgusted,
    surprised: entry.surprised,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSave({ watchedOn, note, visibility, emotions });
    } catch {
      setError('The diary entry could not be updated.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="diary-editor" onSubmit={submit}>
      <div className="diary-editor__fields">
        <div className="field"><label htmlFor={`edit-date-${entry.id}`}>Watched on</label><input id={`edit-date-${entry.id}`} onChange={event => setWatchedOn(event.target.value)} type="date" value={watchedOn} /></div>
        <div className="field field--full"><label htmlFor={`edit-note-${entry.id}`}>What did it mean to you?</label><textarea id={`edit-note-${entry.id}`} maxLength={2000} onChange={event => setNote(event.target.value)} value={note} /></div>
        <fieldset className="visibility-control field--full"><legend>Visibility</legend><label><input checked={visibility === 'private'} name={`visibility-${entry.id}`} onChange={() => setVisibility('private')} type="radio" />Private</label><label><input checked={visibility === 'public'} name={`visibility-${entry.id}`} onChange={() => setVisibility('public')} type="radio" />Public</label></fieldset>
      </div>
      <div className="diary-editor__emotions"><ManualEmotionInput initialScores={emotions} onEmotionChange={setEmotions} /></div>
      {error && <p className="error-text" role="alert">{error}</p>}
      <div className="diary-editor__actions"><button className="button button--primary" disabled={saving} type="submit">{saving ? 'Saving changes' : 'Save changes'}</button><button className="button button--quiet" disabled={saving} onClick={onCancel} type="button">Cancel</button></div>
    </form>
  );
};

export default DiaryEntryEditor;
