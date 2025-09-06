/**
 * EmotionContext
 * 
 * React context for managing emotion detection, storage, and movie interactions.
 * Provides centralized state management for emotion sessions, watch history,
 * watchlist, and emotion display utilities throughout the application.
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { EmotionScores, EmotionSession } from '../types/emotion';
import { Movie } from '../types/movie';
import { useUser } from './UserContext';
import { userMoviesService, UserMovie } from '../services/userMoviesService';
import { personalizedEmotionMappingService } from '../services/personalizedEmotionMapping';

interface EmotionContextType {
  currentEmotion: EmotionScores | null;
  emotionHistory: EmotionSession[];
  watchHistory: UserMovie[];
  watchlist: UserMovie[];
  loading: boolean;
  addEmotionSession: (params: { emotionScores: EmotionScores; detectionMethod: 'webcam' | 'manual' | 'upload'; movieId?: number; confidence?: number }) => void;
  updateMovieEmotion: (movieId: number, emotions: EmotionScores, method: 'webcam' | 'manual' | 'upload', confidence?: number) => void;
  addToWatchHistory: (movie: Movie, emotions?: EmotionScores, rating?: number, confidence?: number) => Promise<void>;
  addToWatchlist: (movie: Movie, emotions?: EmotionScores) => Promise<void>;
  removeFromWatchlist: (movieId: number) => Promise<void>;
  removeFromWatchHistory: (movieId: number) => Promise<void>;
  isInWatchlist: (movieId: number) => boolean;
  isInWatched: (movieId: number) => boolean;
  getEmotionDisplayString: (emotions: EmotionScores, threshold?: number) => { emotion: keyof EmotionScores; value: number; icon: string; color: string }[];
  clearEmotionHistory: () => void;
  refreshUserMovies: () => Promise<void>;
  refreshEmotionalProfile: () => Promise<void>;
}

const EmotionContext = createContext<EmotionContextType | undefined>(undefined);

/**
 * Hook to access the EmotionContext.
 * @returns {EmotionContextType} The emotion context value
 * @throws {Error} If used outside of an EmotionProvider
 */
export const useEmotion = () => {
  const context = useContext(EmotionContext);
  if (!context) {
    throw new Error('useEmotion must be used within an EmotionProvider');
  }
  return context;
};

interface EmotionProviderProps {
  children: React.ReactNode;
}

const EMOTION_ICONS = {
  neutral: 'fas fa-meh',
  happy: 'fas fa-smile',
  sad: 'fas fa-frown',
  angry: 'fas fa-angry',
  fearful: 'fas fa-grimace',
  disgusted: 'fas fa-dizzy',
  surprised: 'fas fa-surprise'
} as const;

const EMOTION_COLORS = {
  neutral: 'text-gray-500',
  happy: 'text-yellow-500',
  sad: 'text-blue-500',
  angry: 'text-red-500',
  fearful: 'text-purple-500',
  disgusted: 'text-green-500',
  surprised: 'text-orange-500'
} as const;

/**
 * EmotionProvider component that provides emotion-related state and functions.
 * @param children - Child components that will have access to the emotion context
 */
export const EmotionProvider: React.FC<EmotionProviderProps> = ({ children }) => {
  const { user } = useUser();
  const [currentEmotion, setCurrentEmotion] = useState<EmotionScores | null>(null);
  const [emotionHistory, setEmotionHistory] = useState<EmotionSession[]>([]);
  const [watchHistory, setWatchHistory] = useState<UserMovie[]>([]);
  const [watchlist, setWatchlist] = useState<UserMovie[]>([]);
  const [loading, setLoading] = useState(false);

  /**
   * Loads user's watch history and watchlist from the server.
   * Called when user changes or when data needs to be refreshed.
   */
  const loadUserMovies = useCallback(async () => {
    if (!user?.id) {
      setWatchHistory([]);
      setWatchlist([]);
      return;
    }

    setLoading(true);
    try {
      const [watchlistData, watchedData] = await Promise.all([
        userMoviesService.getUserMovies('watchlist'),
        userMoviesService.getUserMovies('watched')
      ]);
      
      setWatchlist(watchlistData);
      setWatchHistory(watchedData);
    } catch (error) {
      console.error('Error loading user movies:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadUserMovies();
  }, [loadUserMovies]);

  /**
   * Adds a new emotion detection session to the history.
   * @param params - Object containing emotion scores, detection method, and optional movie ID and confidence
   */
  const addEmotionSession = useCallback((params: { emotionScores: EmotionScores; detectionMethod: 'webcam' | 'manual' | 'upload'; movieId?: number; confidence?: number }) => {
    const newSession: EmotionSession = {
      id: Date.now().toString(),
      type: params.detectionMethod,
      emotionScores: params.emotionScores,
      confidence: params.confidence || 0.5,
      timestamp: new Date()
    };

    setEmotionHistory(prev => [newSession, ...prev]);
    setCurrentEmotion(params.emotionScores);
  }, []);

  const updateMovieEmotion = useCallback((movieId: number, emotions: EmotionScores, method: 'webcam' | 'manual' | 'upload', confidence?: number) => {
    // Pass the correct detection method and confidence
    addEmotionSession({
      emotionScores: emotions,
      detectionMethod: method,
      movieId,
      confidence
    });
  }, [addEmotionSession]);

  /**
   * Adds a movie to the user's watch history with optional emotion data.
   * @param movie - The movie object to add to watch history
   * @param emotions - Optional emotion scores for the movie
   * @param rating - Optional user rating for the movie
   * @param confidence - Optional confidence score for emotion detection
   */
  const addToWatchHistory = useCallback(async (movie: Movie, emotions?: EmotionScores, rating?: number, confidence?: number) => {
    if (!user?.id) return;
    
    try {
      await userMoviesService.markAsWatched(movie, emotions, rating, confidence);
      
      // Update emotion mappings if emotions were provided
      if (emotions && movie.genre_ids) {
        try {
          await personalizedEmotionMappingService.updateUserMappingFromInteraction(
            user.id.toString(),
            movie.genre_ids,
            emotions,
            'logged'
          );
        } catch (error) {
          console.error('Failed to update emotion mappings:', error);
        }
      }
      
      await loadUserMovies(); // Refresh data
    } catch (error) {
      console.error('Error adding to watch history:', error);
      throw error; // Re-throw the error so UI can handle it
    }
  }, [user?.id, loadUserMovies]);

  const addToWatchlist = useCallback(async (movie: Movie, emotions?: EmotionScores) => {
    if (!user?.id) return;
    
    try {
      await userMoviesService.addToWatchlist(movie, emotions);
      await loadUserMovies(); // Refresh data
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      throw error; // Re-throw the error so UI can handle it
    }
  }, [user?.id, loadUserMovies]);



  const removeFromWatchlist = useCallback(async (movieId: number) => {
    try {
      await userMoviesService.removeMovie(movieId, 'watchlist');
      await loadUserMovies(); // Refresh data
    } catch (error) {
      console.error('Error removing from watchlist:', error);
    }
  }, [loadUserMovies]);

  const removeFromWatchHistory = useCallback(async (movieId: number) => {
    try {
      await userMoviesService.removeMovie(movieId, 'watched');
      await loadUserMovies(); // Refresh data
    } catch (error) {
      console.error('Error removing from watch history:', error);
    }
  }, [loadUserMovies]);

  const isInWatchlist = useCallback((movieId: number): boolean => {
    return watchlist.some(movie => movie.movie_id === movieId);
  }, [watchlist]);



  const isInWatched = useCallback((movieId: number): boolean => {
    return watchHistory.some(movie => movie.movie_id === movieId);
  }, [watchHistory]);

  /**
   * Converts emotion scores to display format with icons and colors.
   * @param emotions - The emotion scores object
   * @param threshold - Minimum threshold for emotions to be displayed (default: 0.008)
   * @returns Array of emotion display objects with icon and color information
   */
  const getEmotionDisplayString = useCallback((emotions: EmotionScores, threshold: number = 0.008): { emotion: keyof EmotionScores; value: number; icon: string; color: string }[] => {
    const emotionEntries = Object.entries(emotions) as [keyof EmotionScores, number][];
    
    const significantEmotions = emotionEntries
      .filter(([_, value]) => value > threshold)
      .sort(([_, a], [__, b]) => b - a)
      .map(([emotion, value]) => ({
        emotion: emotion as keyof EmotionScores,
        value,
        icon: EMOTION_ICONS[emotion],
        color: EMOTION_COLORS[emotion]
      }));

    return significantEmotions;
  }, []);

  const clearEmotionHistory = useCallback(() => {
    setEmotionHistory([]);
    setCurrentEmotion(null);
  }, []);

  const refreshUserMovies = useCallback(async () => {
    await loadUserMovies();
  }, [loadUserMovies]);

  const refreshEmotionalProfile = useCallback(async () => {
    if (user?.id) {
      await personalizedEmotionMappingService.refreshUserMappings(user.id.toString());
    }
  }, [user?.id]);

  return (
    <EmotionContext.Provider value={{
      currentEmotion,
      emotionHistory,
      watchHistory,
      watchlist,
      loading,
      addEmotionSession,
      updateMovieEmotion,
      addToWatchHistory,
      addToWatchlist,
      removeFromWatchlist,
      removeFromWatchHistory,
      isInWatchlist,
      isInWatched,
      getEmotionDisplayString,
      clearEmotionHistory,
      refreshUserMovies,
      refreshEmotionalProfile
    }}>
      {children}
    </EmotionContext.Provider>
  );
};