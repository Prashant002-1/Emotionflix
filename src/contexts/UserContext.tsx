/**
 * UserContext
 * 
 * React context for managing user authentication, profile data, and preferences.
 * Handles login, registration, logout, and maintains user statistics and preferences.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { authService, AuthUser } from '../services/authService';
import { diaryService } from '../services/diaryService';

export interface User {
  id: number;
  username: string;
  email: string;
  displayName: string;
  bio: string;
  stats: {
    diaryEntries: number;
    publicEntries: number;
    savedFilms: number;
    averageRating: number | null;
  };
}

interface UserContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => void;
  updateUserStats: () => void;
  updateBio: (bio: string) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

/**
 * Hook to access the UserContext.
 * @returns {UserContextType} The user context value with authentication state and functions
 * @throws {Error} If used outside of a UserProvider
 */
// eslint-disable-next-line react-refresh/only-export-components
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
  bio: authUser.bio || '',
  stats: {
    diaryEntries: 0,
    publicEntries: 0,
    savedFilms: 0,
    averageRating: null,
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
      const stats = await diaryService.summary();
      
      const updatedUser = {
        ...userToUpdate,
        stats: {
          diaryEntries: stats.entries,
          publicEntries: stats.public_entries,
          savedFilms: stats.saved,
          averageRating: stats.average_rating,
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
          } catch {
            authService.logout();
          }
        }
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

  const updateBio = async (bio: string) => {
    const response = await authService.updateProfile({ bio });
    setUser(current => current ? { ...current, bio: response.user.bio || '' } : current);
  };

  return (
    <UserContext.Provider value={{
      user,
      loading,
      login,
      register,
      logout,
      updateUserStats,
      updateBio,
    }}>
      {children}
    </UserContext.Provider>
  );
};
