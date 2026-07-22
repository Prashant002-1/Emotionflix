import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  authService,
  type AuthUser,
  type DemoDiaryBootstrap,
  type DemoHomeBootstrap,
} from '../services/authService';

export interface User {
  id: number;
  username: string;
  email: string;
  displayName: string;
  bio: string;
}

interface UserContextType {
  user: User | null;
  loading: boolean;
  enterDemo: () => Promise<void>;
  takeDemoDiary: () => DemoDiaryBootstrap | null;
  takeDemoHome: () => DemoHomeBootstrap | null;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within a UserProvider');
  return context;
};

const createUserFromAuth = (authUser: AuthUser): User => ({
  id: authUser.id,
  username: authUser.username,
  email: authUser.email,
  displayName: authUser.username.charAt(0).toUpperCase() + authUser.username.slice(1),
  bio: authUser.bio || '',
});

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const bootstrapRef = useRef<{
    diary?: DemoDiaryBootstrap;
    home?: DemoHomeBootstrap;
  } | null>(null);

  const openDemoSession = useCallback(async () => {
    setLoading(true);
    try {
      const response = await authService.openDemo();
      authService.storeAuthData(response.token, response.user);
      bootstrapRef.current = { ...response.bootstrap };
      setUser(createUserFromAuth(response.user));
    } catch (error) {
      authService.clear();
      bootstrapRef.current = null;
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authService.getStoredToken()) {
      void openDemoSession().catch(() => undefined);
    } else {
      authService.clear();
      setLoading(false);
    }
  }, [openDemoSession]);

  const takeDemoDiary = useCallback(() => {
    const diary = bootstrapRef.current?.diary || null;
    if (bootstrapRef.current) delete bootstrapRef.current.diary;
    return diary;
  }, []);

  const takeDemoHome = useCallback(() => {
    const home = bootstrapRef.current?.home || null;
    if (bootstrapRef.current) delete bootstrapRef.current.home;
    return home;
  }, []);

  return (
    <UserContext.Provider value={{
      user,
      loading,
      enterDemo: openDemoSession,
      takeDemoDiary,
      takeDemoHome,
    }}>
      {children}
    </UserContext.Provider>
  );
};
