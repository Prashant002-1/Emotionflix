import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { authService, AuthUser } from '../services/authService';

export interface User {
  id: number;
  username: string;
  email: string;
  displayName: string;
  preferences: {
    favoriteGenres: number[];
    emotionWeights: {
      neutral: number;
      happy: number;
      sad: number;
      angry: number;
      fearful: number;
      disgusted: number;
      surprised: number;
    };
  };
  stats: {
    moviesWatched: number;
    emotionsLogged: number;
    favoriteEmotion: string;
  };
}

interface UserContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => void;
  updateUserStats: () => void;
  updatePreferences: (preferences: Partial<User['preferences']>) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

interface UserProviderProps {
  children: React.ReactNode;
}

const createUserFromAuth = (authUser: AuthUser): User => ({
  id: authUser.id,
  username: authUser.username,
  email: authUser.email,
  displayName: authUser.username.charAt(0).toUpperCase() + authUser.username.slice(1),
  preferences: {
    favoriteGenres: [],
    emotionWeights: {
      neutral: 0.14,
      happy: 0.14,
      sad: 0.14,
      angry: 0.14,
      fearful: 0.14,
      disgusted: 0.14,
      surprised: 0.16
    }
  },
  stats: {
    moviesWatched: 0,
    emotionsLogged: 0,
    favoriteEmotion: 'neutral'
  }
});

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const userRef = useRef<User | null>(null);
  
  // Keep ref in sync with state
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const updateUserStatsInternal = (userToUpdate: User) => {
    // Get watch history from local storage
    const watchHistoryData = localStorage.getItem('emotionflix-watch-history');
    const watchHistory = watchHistoryData ? JSON.parse(watchHistoryData) : [];
    
    // Calculate actual stats from data
    const moviesWatched = watchHistory.length;
    const emotionsLogged = watchHistory.filter((movie) => movie.hasLoggedEmotion).length;
    
    // Calculate favorite emotion from watch history
    const emotionCounts: Record<string, number> = {
      neutral: 0,
      happy: 0,
      sad: 0,
      angry: 0,
      fearful: 0,
      disgusted: 0,
      surprised: 0
    };
    
    watchHistory.forEach((movie: any) => {
      if (movie.emotions) {
        // Find the emotion with the highest score for this movie
        let topEmotion = 'neutral';
        let maxScore = 0;
        Object.entries(movie.emotions).forEach(([emotion, score]) => {
          if (typeof score === 'number' && score > maxScore) {
            maxScore = score;
            topEmotion = emotion;
          }
        });
        emotionCounts[topEmotion]++;
      }
    });
    
    // Find the most frequent emotion
    let favoriteEmotion = 'neutral';
    let maxCount = 0;
    Object.entries(emotionCounts).forEach(([emotion, count]) => {
      if (count > maxCount) {
        maxCount = count;
        favoriteEmotion = emotion;
      }
    });

    // Only update if stats have actually changed
    const currentStats = userToUpdate.stats;
    if (
      currentStats.moviesWatched === moviesWatched &&
      currentStats.emotionsLogged === emotionsLogged &&
      currentStats.favoriteEmotion === favoriteEmotion
    ) {
      return; // No changes needed
    }

    const updatedUser = {
      ...userToUpdate,
      stats: {
        moviesWatched,
        emotionsLogged,
        favoriteEmotion
      }
    };

    setUser(updatedUser);
    localStorage.setItem('emotionflix-user', JSON.stringify(updatedUser));
  };

  useEffect(() => {
    const initializeUser = async () => {
      try {
        const token = authService.getStoredToken();
        if (token) {
          try {
            const { user: authUser } = await authService.getProfile();
            const userWithStats = createUserFromAuth(authUser);
            setUser(userWithStats);
            // Update stats after setting user
            setTimeout(() => {
              updateUserStatsInternal(userWithStats);
            }, 0);
          } catch (error) {
            authService.logout();
          }
        }
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    initializeUser();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await authService.login({ email, password });
      authService.storeAuthData(response.token, response.user);
      const userWithStats = createUserFromAuth(response.user);
      setUser(userWithStats);
      updateUserStatsInternal(userWithStats);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, username: string, password: string) => {
    setLoading(true);
    try {
      const response = await authService.register({ email, username, password });
      authService.storeAuthData(response.token, response.user);
      const userWithStats = createUserFromAuth(response.user);
      setUser(userWithStats);
      updateUserStatsInternal(userWithStats);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const updateUserStats = useCallback(() => {
    if (!userRef.current) return;
    updateUserStatsInternal(userRef.current);
  }, []);

  const updatePreferences = (newPreferences: Partial<User['preferences']>) => {
    if (!user) return;

    const updatedUser = {
      ...user,
      preferences: {
        ...user.preferences,
        ...newPreferences
      }
    };

    setUser(updatedUser);
    localStorage.setItem('emotionflix-user', JSON.stringify(updatedUser));
  };

  return (
    <UserContext.Provider value={{
      user,
      loading,
      login,
      register,
      logout,
      updateUserStats,
      updatePreferences
    }}>
      {children}
    </UserContext.Provider>
  );
};