/**
 * PERSONALIZED EMOTION MAPPING SERVICE
 * Dynamic emotion-to-genre mapping based on user behavior
 */

import { EmotionScores } from '../types/emotion';
import apiClient from './apiClient';

export interface UserEmotionGenreMapping {
  emotion: keyof EmotionScores;
  genre_id: number;
  weight: number;
}

export interface PersonalizedMapping {
  [emotion: string]: { [genreId: number]: number };
}

class PersonalizedEmotionMappingService {
  private userMappings: Map<string, PersonalizedMapping> = new Map();

  /**
   * Get personalized emotion-to-genre mappings for a user
   * Fetches from backend database, creates default mappings for new users
   */
  async getUserEmotionGenreMappings(userId: string): Promise<PersonalizedMapping> {
    // Check cache first
    if (this.userMappings.has(userId)) {
      return this.userMappings.get(userId)!;
    }

    try {
      // Fetch from the database
      const personalizedMapping = await this.fetchUserMappingsFromDB(userId);
      
      if (Object.keys(personalizedMapping).length === 0) {
        // Create default mappings for new users and store them
        const defaultMapping = this.getEnhancedDefaultMappings();
        await this.persistUserMappingsToDB(userId, defaultMapping, [], {
          neutral: 0, happy: 0, sad: 0, angry: 0, fearful: 0, disgusted: 0, surprised: 0
        }, 'default');
        this.userMappings.set(userId, defaultMapping);
        return defaultMapping;
      }

      this.userMappings.set(userId, personalizedMapping);
      return personalizedMapping;
    } catch (error) {
      console.error('Error fetching user mappings:', error);
      // Return enhanced default mappings as fallback
      return this.getEnhancedDefaultMappings();
    }
  }

  /**
   * Update user mappings based on movie interaction
   */
  async updateUserMappingFromInteraction(
    userId: string,
    movieGenres: number[],
    emotionScores: EmotionScores,
    interactionType: 'logged' | 'watchlisted' | 'rated_positive' | 'rated_negative'
  ): Promise<void> {
    try {
      // Weight multipliers based on interaction type
      const weightMultipliers = {
        logged: 1.0,
        watchlisted: 0.5,
        rated_positive: 2.0,
        rated_negative: -0.5
      };

      const multiplier = weightMultipliers[interactionType];
      
      // Get current user mappings
      const currentMappings = await this.getUserEmotionGenreMappings(userId);
      
      // Update mappings based on this interaction
      Object.entries(emotionScores).forEach(([emotion, intensity]) => {
        if (intensity > 0.01) { // Process all meaningful emotions
          if (!currentMappings[emotion]) {
            currentMappings[emotion] = {};
          }
          
          movieGenres.forEach(genreId => {
            const currentWeight = currentMappings[emotion][genreId] || 0;
            const newWeight = intensity * multiplier;
            
            // Use exponential moving average to update weights
            currentMappings[emotion][genreId] = currentWeight * 0.8 + newWeight * 0.2;
          });
        }
      });

      // Update cache
      this.userMappings.set(userId, currentMappings);
      
      // Persist to database
      await this.persistUserMappingsToDB(userId, currentMappings, movieGenres, emotionScores, interactionType);
      
    } catch (error) {
      console.error('Error updating user mapping from interaction:', error);
    }
  }

  /**
   * Get personalized genre recommendations based on emotions
   */
  async getPersonalizedGenreRecommendations(
    userId: string,
    emotions: EmotionScores
  ): Promise<number[]> {
    const userMappings = await this.getUserEmotionGenreMappings(userId);
    const genreWeights: Record<number, number> = {};

    // Calculate weighted scores for each genre
    Object.entries(emotions).forEach(([emotion, intensity]) => {
      if (intensity > 0.01 && userMappings[emotion]) {
        Object.entries(userMappings[emotion]).forEach(([genreId, weight]) => {
          const genreIdNum = parseInt(genreId);
          // Apply exponential weighting to amplify stronger emotions
          const amplifiedWeight = Math.pow(intensity, 0.7) * weight * 2;
          genreWeights[genreIdNum] = (genreWeights[genreIdNum] || 0) + amplifiedWeight;
        });
      }
    });

    // Sort and return top genres
    return Object.entries(genreWeights)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([genreId]) => parseInt(genreId));
  }

  /**
   * Enhanced default mappings with better weights and more genres
   */
  private getEnhancedDefaultMappings(): PersonalizedMapping {
    return {
      happy: {
        35: 0.9,   // Comedy - strong match
        16: 0.7,   // Animation
        10402: 0.6, // Music
        10751: 0.8, // Family
        12: 0.5,   // Adventure
        10749: 0.6 // Romance
      },
      sad: {
        18: 0.9,   // Drama - strong match
        10749: 0.8, // Romance
        10752: 0.6, // War
        36: 0.5,   // History
        99: 0.4    // Documentary
      },
      angry: {
        28: 0.9,   // Action - strong match
        80: 0.8,   // Crime
        53: 0.8,   // Thriller
        37: 0.6,   // Western
        10752: 0.7 // War
      },
      fearful: {
        27: 0.9,   // Horror - strong match
        53: 0.8,   // Thriller
        9648: 0.7, // Mystery
        878: 0.5   // Sci-Fi (for existential fear)
      },
      surprised: {
        878: 0.9,  // Sci-Fi - strong match
        14: 0.8,   // Fantasy
        9648: 0.7, // Mystery
        12: 0.6,   // Adventure
        53: 0.5    // Thriller
      },
      disgusted: {
        27: 0.8,   // Horror
        80: 0.6,   // Crime
        53: 0.5    // Thriller
      },
      neutral: {
        18: 0.6,   // Drama
        28: 0.5,   // Action
        35: 0.4,   // Comedy
        99: 0.7,   // Documentary
        36: 0.5    // History
      }
    };
  }

  /**
   * Fetch user mappings from backend API
   */
  private async fetchUserMappingsFromDB(userId: string): Promise<PersonalizedMapping> {
    try {
      const response = await apiClient.get(`/emotion-mappings/${userId}`);
      return response.data.mappings || {};
    } catch (error) {
      console.error('Error fetching user mappings from database:', error);
      return {};
    }
  }

  /**
   * Persist user mappings to backend API
   */
  private async persistUserMappingsToDB(
    userId: string,
    mappings: PersonalizedMapping,
    _movieGenres: number[],
    _emotionScores: EmotionScores,
    _interactionType: string
  ): Promise<void> {
    try {
      await apiClient.put(`/emotion-mappings/${userId}`, { mappings });
    } catch (error) {
      console.error('Failed to persist user mappings:', error);
      throw error; // Re-throw to handle errors properly
    }
  }

  /**
   * Clear user mapping cache (useful for testing and refreshing data)
   */
  clearUserCache(userId: string): void {
    this.userMappings.delete(userId);
  }

  /**
   * Refresh user mappings from database (clears cache and refetches)
   */
  async refreshUserMappings(userId: string): Promise<PersonalizedMapping> {
    this.clearUserCache(userId);
    return await this.getUserEmotionGenreMappings(userId);
  }
}

export const personalizedEmotionMappingService = new PersonalizedEmotionMappingService();
export default PersonalizedEmotionMappingService;