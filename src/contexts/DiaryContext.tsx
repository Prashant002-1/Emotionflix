import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { diaryService } from '../services/diaryService';
import { DiaryEntry, DiaryEntryInput, DiarySummary, SavedFilm } from '../types/diary';
import { EmotionScores } from '../types/emotion';
import { useUser } from './UserContext';

interface DiaryContextValue {
  entries: DiaryEntry[];
  savedFilms: SavedFilm[];
  summary: DiarySummary | null;
  currentSignal: EmotionScores | null;
  loading: boolean;
  refresh: () => Promise<void>;
  setCurrentSignal: (signal: EmotionScores | null) => void;
  createEntry: (input: DiaryEntryInput) => Promise<DiaryEntry>;
  updateEntry: (entryId: number, changes: Partial<Omit<DiaryEntryInput, 'movieId'>>) => Promise<DiaryEntry>;
  removeEntry: (entryId: number) => Promise<void>;
  saveFilm: (movieId: number) => Promise<void>;
  unsaveFilm: (movieId: number) => Promise<void>;
  isSaved: (movieId: number) => boolean;
  isLogged: (movieId: number) => boolean;
}

const DiaryContext = createContext<DiaryContextValue | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export const useDiary = () => {
  const value = useContext(DiaryContext);
  if (!value) throw new Error('useDiary must be used inside DiaryProvider');
  return value;
};

export const DiaryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useUser();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [savedFilms, setSavedFilms] = useState<SavedFilm[]>([]);
  const [summary, setSummary] = useState<DiarySummary | null>(null);
  const [currentSignal, setCurrentSignal] = useState<EmotionScores | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setEntries([]);
      setSavedFilms([]);
      setSummary(null);
      return;
    }
    setLoading(true);
    try {
      const [nextEntries, nextSaved, nextSummary] = await Promise.all([
        diaryService.entries(), diaryService.saved(), diaryService.summary(),
      ]);
      setEntries(nextEntries);
      setSavedFilms(nextSaved);
      setSummary(nextSummary);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { void refresh(); }, [refresh]);

  const createEntry = useCallback(async (input: DiaryEntryInput) => {
    const entry = await diaryService.create(input);
    await refresh();
    return entry;
  }, [refresh]);

  const removeEntry = useCallback(async (entryId: number) => {
    await diaryService.remove(entryId);
    await refresh();
  }, [refresh]);

  const updateEntry = useCallback(async (entryId: number, changes: Partial<Omit<DiaryEntryInput, 'movieId'>>) => {
    const entry = await diaryService.update(entryId, changes);
    await refresh();
    return entry;
  }, [refresh]);

  const saveFilm = useCallback(async (movieId: number) => {
    await diaryService.save(movieId);
    await refresh();
  }, [refresh]);

  const unsaveFilm = useCallback(async (movieId: number) => {
    await diaryService.unsave(movieId);
    await refresh();
  }, [refresh]);

  const value = useMemo<DiaryContextValue>(() => ({
    entries,
    savedFilms,
    summary,
    currentSignal,
    loading,
    refresh,
    setCurrentSignal,
    createEntry,
    updateEntry,
    removeEntry,
    saveFilm,
    unsaveFilm,
    isSaved: movieId => savedFilms.some(film => film.movie_id === movieId),
    isLogged: movieId => entries.some(entry => entry.movie_id === movieId),
  }), [entries, savedFilms, summary, currentSignal, loading, refresh, createEntry, updateEntry, removeEntry, saveFilm, unsaveFilm]);

  return <DiaryContext.Provider value={value}>{children}</DiaryContext.Provider>;
};
