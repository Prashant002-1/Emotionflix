import apiClient from './apiClient';
import { EmotionScores } from '../types/emotion';

export interface CommunityEntry extends EmotionScores {
  id: number;
  user_id: number;
  movie_id: number;
  username: string;
  bio: string;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  watched_on: string;
  rating: number | null;
  note: string;
  created_at: string;
  reaction_count: number;
  reacted: boolean;
  following: boolean;
}

export interface CommunityPerson extends EmotionScores {
  id: number;
  username: string;
  bio: string;
  entries: number;
  followers: number;
  following_count: number;
  following: boolean;
  pattern_overlap: number | null;
}

export interface MemberProfile extends Omit<CommunityPerson, 'pattern_overlap'> {
  pattern_overlap?: number | null;
}

export const discoveryService = {
  async feed(limit = 24): Promise<CommunityEntry[]> {
    const response = await apiClient.get('/discovery/feed', { params: { limit } });
    return response.data.entries;
  },
  async filmEntries(movieId: number): Promise<CommunityEntry[]> {
    const response = await apiClient.get(`/discovery/films/${movieId}`);
    return response.data.entries;
  },
  async people(): Promise<CommunityPerson[]> {
    const response = await apiClient.get('/discovery/people');
    return response.data.people;
  },
  async profile(username: string): Promise<{ person: MemberProfile; entries: CommunityEntry[] }> {
    const response = await apiClient.get(`/discovery/people/${encodeURIComponent(username)}`);
    return response.data;
  },
  async follow(personId: number): Promise<void> {
    await apiClient.post(`/discovery/people/${personId}/follow`);
  },
  async unfollow(personId: number): Promise<void> {
    await apiClient.delete(`/discovery/people/${personId}/follow`);
  },
  async react(entryId: number): Promise<void> {
    await apiClient.post(`/discovery/entries/${entryId}/reaction`);
  },
  async unreact(entryId: number): Promise<void> {
    await apiClient.delete(`/discovery/entries/${entryId}/reaction`);
  },
};
