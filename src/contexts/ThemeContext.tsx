/**
 * ThemeContext
 * 
 * React context for managing application theme state (dark/light mode).
 * Persists theme preference in localStorage and applies theme to document.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * Hook to access the ThemeContext.
 * @returns {ThemeContextType} The theme context value with current theme and toggle function
 * @throws {Error} If used outside of a ThemeProvider
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

/**
 * ThemeProvider component that manages theme state and persistence.
 * @param children - Child components that will have access to the theme context
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const savedTheme = localStorage.getItem('emotionflix-theme') as Theme;
        return savedTheme && (savedTheme === 'dark' || savedTheme === 'light') ? savedTheme : 'dark';
      }
    } catch {
      // Fallback if localStorage is not available
    }
    return 'dark';
  });

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('emotionflix-theme', theme);
      }
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', theme);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [theme]);

  /**
   * Toggles between dark and light theme modes.
   */
  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};