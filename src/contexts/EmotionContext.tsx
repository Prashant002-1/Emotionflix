import React, { createContext, useContext, useState, useCallback } from 'react';
import { EmotionScores, EmotionSession, WatchedMovie } from '../types/emotion';

interface EmotionContextType {
  currentEmotion: EmotionScores | null;
  emotionHistory: EmotionSession[];
  watchHistory: WatchedMovie[];
  watchlist: WatchedMovie[];
  addEmotionSession: (params: { emotionScores: EmotionScores; detectionMethod: 'webcam' | 'manual' | 'upload'; movieId?: number; confidence?: number }) => void;
  updateMovieEmotion: (movieId: number, emotions: EmotionScores, method: 'webcam' | 'manual' | 'upload', confidence?: number) => void;
  addToWatchHistory: (movie: Omit<WatchedMovie, 'userId' | 'watchedAt' | 'hasLoggedEmotion'>) => void;
  addToWatchlist: (movie: Omit<WatchedMovie, 'userId' | 'watchedAt' | 'hasLoggedEmotion'>) => void;
  removeFromWatchlist: (movieId: number) => void;
  removeFromWatchHistory: (movieId: number) => void;
  isInWatchlist: (movieId: number) => boolean;
  getEmotionDisplayString: (emotions: EmotionScores, threshold?: number) => { emotion: keyof EmotionScores; value: number; icon: string; color: string }[];
  clearEmotionHistory: () => void;
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
  const [currentEmotion, setCurrentEmotion] = useState<EmotionScores | null>(null);
  const [emotionHistory, setEmotionHistory] = useState<EmotionSession[]>([]);
  const [watchHistory, setWatchHistory] = useState<WatchedMovie[]>(() => {
    const saved = localStorage.getItem('emotionflix-watch-history');
    if (saved) {
      return JSON.parse(saved);
    }
    
    return [
      {
        movieId: 550,
        userId: 'user123',
        watchedAt: new Date('2024-01-15'),
        title: 'Fight Club',
        poster_path: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
        release_date: '1999-10-15',
        vote_average: 8.4,
        hasLoggedEmotion: true,
        emotions: { happy: 0.1, sad: 0.3, angry: 0.4, fearful: 0.1, neutral: 0.05, disgusted: 0.03, surprised: 0.02 }
      },
      {
        movieId: 680,
        userId: 'user123', 
        watchedAt: new Date('2024-01-12'),
        title: 'Pulp Fiction',
        poster_path: '/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg',
        release_date: '1994-10-14',
        vote_average: 8.9,
        hasLoggedEmotion: true,
        emotions: { happy: 0.2, sad: 0.1, angry: 0.3, fearful: 0.2, neutral: 0.15, disgusted: 0.03, surprised: 0.02 }
      },
      {
        movieId: 13,
        userId: 'user123',
        watchedAt: new Date('2024-01-10'), 
        title: 'Forrest Gump',
        poster_path: '/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg',
        release_date: '1994-07-06',
        vote_average: 8.5,
        hasLoggedEmotion: false,
        emotions: undefined
      },
      {
        movieId: 155,
        userId: 'user123',
        watchedAt: new Date('2024-01-08'),
        title: 'The Dark Knight',
        poster_path: '/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
        release_date: '2008-07-18',
        vote_average: 9.0,
        hasLoggedEmotion: true,
        emotions: { happy: 0.15, sad: 0.2, angry: 0.1, fearful: 0.4, neutral: 0.1, disgusted: 0.03, surprised: 0.02 }
      }
    ];
  });

  const [watchlist, setWatchlist] = useState<WatchedMovie[]>(() => {
    const saved = localStorage.getItem('emotionflix-watchlist');
    return saved ? JSON.parse(saved) : [];
  });

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
    
    setWatchHistory(prev => {
      const updated = prev.map(movie => 
        movie.movieId === movieId 
          ? { ...movie, emotions, hasLoggedEmotion: true }
          : movie
      );
      localStorage.setItem('emotionflix-watch-history', JSON.stringify(updated));
      return updated;
    });

    // Pass the correct detection method and confidence
    addEmotionSession({
      emotionScores: emotions,
      detectionMethod: method,
      movieId,
      confidence
    });
  }, [addEmotionSession]);

  const addToWatchHistory = useCallback((movie: Omit<WatchedMovie, 'userId' | 'watchedAt' | 'hasLoggedEmotion'>) => {
    
    setWatchHistory(prev => {
      // Check if movie already exists in watch history
      const existingMovieIndex = prev.findIndex(m => m.movieId === movie.movieId);
      
      if (existingMovieIndex !== -1) {
        // Movie exists, update emotions and hasLoggedEmotion flag
        const updated = prev.map((m, index) => 
          index === existingMovieIndex 
            ? { ...m, emotions: movie.emotions, hasLoggedEmotion: !!movie.emotions }
            : m
        );
        localStorage.setItem('emotionflix-watch-history', JSON.stringify(updated));
        return updated;
      } else {
        // New movie, add to beginning of list
        const newWatchedMovie: WatchedMovie = {
          ...movie,
          userId: 'user123',
          watchedAt: new Date(),
          hasLoggedEmotion: !!movie.emotions
        };
        const updated = [newWatchedMovie, ...prev];
        localStorage.setItem('emotionflix-watch-history', JSON.stringify(updated));
        return updated;
      }
    });
  }, []);

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

  const addToWatchlist = useCallback((movie: Omit<WatchedMovie, 'userId' | 'watchedAt' | 'hasLoggedEmotion'>) => {
    
    setWatchlist(prev => {
      if (prev.some(m => m.movieId === movie.movieId)) {
        return prev;
      }
      
      const newWatchlistMovie: WatchedMovie = {
        ...movie,
        userId: 'user123',
        watchedAt: new Date(),
        hasLoggedEmotion: false
      };
      
      const updated = [newWatchlistMovie, ...prev];
      localStorage.setItem('emotionflix-watchlist', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const removeFromWatchlist = useCallback((movieId: number) => {
    
    setWatchlist(prev => {
      const updated = prev.filter(movie => movie.movieId !== movieId);
      localStorage.setItem('emotionflix-watchlist', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const removeFromWatchHistory = useCallback((movieId: number) => {
    
    setWatchHistory(prev => {
      const updated = prev.filter(movie => movie.movieId !== movieId);
      localStorage.setItem('emotionflix-watch-history', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const isInWatchlist = useCallback((movieId: number): boolean => {
    return watchlist.some(movie => movie.movieId === movieId);
  }, [watchlist]);

  const clearEmotionHistory = useCallback(() => {
    setEmotionHistory([]);
    setCurrentEmotion(null);
    localStorage.removeItem('emotionflix-emotion-history');
  }, []);

  return (
    <EmotionContext.Provider value={{
      currentEmotion,
      emotionHistory,
      watchHistory,
      watchlist,
      addEmotionSession,
      updateMovieEmotion,
      addToWatchHistory,
      addToWatchlist,
      removeFromWatchlist,
      removeFromWatchHistory,
      isInWatchlist,
      getEmotionDisplayString,
      clearEmotionHistory
    }}>
      {children}
    </EmotionContext.Provider>
  );
};