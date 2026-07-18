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
  watched_on: string;
  note: string;
  expression_image_path: string | null;
  expression_image_alt: string | null;
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
  follows_you: boolean;
  pattern_overlap: number | null;
  shared_films: number | null;
  shared_film_title: string | null;
  latest_movie_id: number;
  latest_title: string;
  latest_poster_path: string | null;
  latest_note: string | null;
}

export interface MemberProfile extends Omit<CommunityPerson, 'pattern_overlap' | 'shared_films' | 'latest_movie_id' | 'latest_title' | 'latest_poster_path' | 'latest_note'> {
  pattern_overlap?: number | null;
}

export interface ActivityEvent {
  kind: 'reaction' | 'follow';
  created_at: string;
  actor_id: number;
  username: string;
  entry_id: number | null;
  movie_id: number | null;
  title: string | null;
  poster_path: string | null;
  note: string | null;
}

export interface CommunityFilm {
  movie_id: number;
  title: string;
  overview: string;
  release_date: string;
  poster_path: string | null;
  backdrop_path: string | null;
  response_count: number;
  people_count: number;
  latest_at: string;
  latest_username: string;
  latest_note: string | null;
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
  async activity(limit = 40): Promise<ActivityEvent[]> {
    const response = await apiClient.get('/discovery/activity', { params: { limit } });
    return response.data.activity;
  },
  async pulse(): Promise<CommunityFilm[]> {
    const response = await apiClient.get('/discovery/pulse');
    return response.data.films;
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
