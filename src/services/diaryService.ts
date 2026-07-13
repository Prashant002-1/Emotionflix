import apiClient from './apiClient';
import { DiaryEntry, DiaryEntryInput, DiarySummary, SavedFilm } from '../types/diary';

export const diaryService = {
  async entries(limit = 60): Promise<DiaryEntry[]> {
    const response = await apiClient.get('/diary', { params: { limit } });
    return response.data.entries;
  },

  async summary(): Promise<DiarySummary> {
    const response = await apiClient.get('/diary/summary');
    return response.data;
  },

  async create(input: DiaryEntryInput): Promise<DiaryEntry> {
    const response = await apiClient.post('/diary', input);
    return response.data.entry;
  },

  async update(entryId: number, changes: Partial<Omit<DiaryEntryInput, 'movieId'>>): Promise<DiaryEntry> {
    const response = await apiClient.patch(`/diary/${entryId}`, changes);
    return response.data.entry;
  },

  async remove(entryId: number): Promise<void> {
    await apiClient.delete(`/diary/${entryId}`);
  },

  async saved(): Promise<SavedFilm[]> {
    const response = await apiClient.get('/library/saved');
    return response.data.films;
  },

  async save(movieId: number): Promise<void> {
    await apiClient.post('/library/saved', { movieId });
  },

  async unsave(movieId: number): Promise<void> {
    await apiClient.delete(`/library/saved/${movieId}`);
  },
};
