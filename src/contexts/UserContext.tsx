/**
 * UserContext
 * 
 * React context for managing user authentication, profile data, and preferences.
 * Handles login, registration, logout, and maintains user statistics and preferences.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { authService, AuthUser } from '../services/authService';
import { userMoviesService } from '../services/userMoviesService';

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

/**
 * Hook to access the UserContext.
 * @returns {UserContextType} The user context value with authentication state and functions
 * @throws {Error} If used outside of a UserProvider
 */
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

/**
 * Creates a User object from AuthUser data with default preferences and stats.
 * @param authUser - Authenticated user data from the server
 * @returns Complete User object with default preferences and empty stats
 */
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

/**
 * UserProvider component that manages user authentication and profile state.
 * @param children - Child components that will have access to the user context
 */
export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const userRef = useRef<User | null>(null);
  
  // Keep ref in sync with state
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const updateUserStatsInternal = async (userToUpdate: User) => {
    if (!userToUpdate.id) return;

    try {
      const stats = await userMoviesService.getUserStats();
      
      const updatedUser = {
        ...userToUpdate,
        stats: {
          moviesWatched: stats.movies.watched,
          emotionsLogged: stats.emotions.total,
          favoriteEmotion: stats.emotions.favoriteEmotion
        }
      };

      setUser(updatedUser);
    } catch (error) {
      console.error('Error updating user stats:', error);
    }
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

  /**
   * Authenticates user with email and password.
   * @param email - User's email address
   * @param password - User's password
   * @throws {Error} If authentication fails
   */
  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await authService.login({ email, password });
      authService.storeAuthData(response.token, response.user);
      const userWithStats = createUserFromAuth(response.user);
      
      setUser(userWithStats);
      await updateUserStatsInternal(userWithStats);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Registers a new user account.
   * @param email - User's email address
   * @param username - Desired username
   * @param password - User's password
   * @throws {Error} If registration fails
   */
  const register = async (email: string, username: string, password: string) => {
    setLoading(true);
    try {
      const response = await authService.register({ email, username, password });
      authService.storeAuthData(response.token, response.user);
      const userWithStats = createUserFromAuth(response.user);
      setUser(userWithStats);
      await updateUserStatsInternal(userWithStats);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logs out the current user and redirects to home page.
   */
  const logout = () => {
    authService.logout();
    setUser(null);
    // Redirect to home page after logout
    window.location.href = '/';
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