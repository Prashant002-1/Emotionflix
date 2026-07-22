import apiClient from './apiClient';
import type { CommunityEntry, CommunityFilm, CommunityPerson } from './discoveryService';
import type { RecommendationResponse } from './recommendationService';
import type { DiaryEntry, DiarySummary, SavedFilm } from '../types/diary';

export interface AuthUser {
  id: number;
  email: string;
  username: string;
  bio?: string;
}

export interface DemoDiaryBootstrap {
  entries: DiaryEntry[];
  savedFilms: SavedFilm[];
  summary: DiarySummary;
}

export interface DemoHomeBootstrap {
  entries: CommunityEntry[];
  recommendations: RecommendationResponse;
  people: CommunityPerson[];
  pulse: CommunityFilm[];
}

export interface DemoResponse {
  message: string;
  user: AuthUser;
  token: string;
  bootstrap: {
    diary: DemoDiaryBootstrap;
    home: DemoHomeBootstrap;
  };
}

const clearLegacyAuth = () => {
  localStorage.removeItem('auth-token');
  localStorage.removeItem('auth-user');
};

export const authService = {
  async openDemo(): Promise<DemoResponse> {
    const response = await apiClient.post('/auth/demo');
    return response.data;
  },

  clear() {
    sessionStorage.removeItem('auth-token');
    sessionStorage.removeItem('auth-user');
    clearLegacyAuth();
  },

  getStoredToken(): string | null {
    return sessionStorage.getItem('auth-token');
  },

  storeAuthData(token: string, user: AuthUser) {
    clearLegacyAuth();
    sessionStorage.setItem('auth-token', token);
    sessionStorage.setItem('auth-user', JSON.stringify(user));
  },
};
