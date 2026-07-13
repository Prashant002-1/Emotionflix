import apiClient from './apiClient';
import { EmotionScores } from '../types/emotion';
import { Movie } from '../types/movie';

export interface RecommendationProfile {
  source: 'popular' | 'signal' | 'diary' | 'diary_and_signal';
  historySize: number;
  dominantEmotions: { key: keyof EmotionScores; weight: number }[];
  topGenres: { id: number; name: string; weight: number }[];
}

export interface RecommendationResponse {
  profile: RecommendationProfile;
  forYou: Movie[];
  adjacent: Movie[];
  community: Movie[];
}

export const recommendationService = {
  async get(signal?: EmotionScores): Promise<RecommendationResponse> {
    const response = await apiClient.post('/recommendations', signal ? { signal } : {});
    return response.data;
  },
};
