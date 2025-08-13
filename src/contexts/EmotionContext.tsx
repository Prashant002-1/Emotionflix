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

export const EmotionProvider: React.FC<EmotionProviderProps> = ({ children }) => {
  const { user } = useUser();
  const [currentEmotion, setCurrentEmotion] = useState<EmotionScores | null>(null);
  const [emotionHistory, setEmotionHistory] = useState<EmotionSession[]>([]);
  const [watchHistory, setWatchHistory] = useState<UserMovie[]>([]);
  const [watchlist, setWatchlist] = useState<UserMovie[]>([]);
  const [loading, setLoading] = useState(false);

  // Load user movies from server when user changes
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