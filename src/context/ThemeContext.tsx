/**
 * Theme Context
 *
 * Provides global theme state and methods throughout the application.
 * Handles dark mode toggle and persists preference in localStorage.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

interface ThemeContextType {
  darkMode: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (enabled: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * Theme Provider Component
 */
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [darkMode, setDarkModeState] = useState(false);

  // Load theme preference from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('app_darkMode');
    const isDark = savedTheme === 'true';
    console.log('[ThemeContext] Loading theme from localStorage:', savedTheme, '-> isDark:', isDark);
    setDarkModeState(isDark);

    // Apply theme to document
    if (isDark) {
      document.documentElement.classList.add('dark');
      console.log('[ThemeContext] Applied dark class to HTML');
    } else {
      document.documentElement.classList.remove('dark');
      console.log('[ThemeContext] Removed dark class from HTML');
    }
  }, []);

  // Apply dark mode class to document when state changes
  useEffect(() => {
    console.log('[ThemeContext] darkMode state changed to:', darkMode);
    if (darkMode) {
      document.documentElement.classList.add('dark');
      console.log('[ThemeContext] Applied dark class to HTML');
    } else {
      document.documentElement.classList.remove('dark');
      console.log('[ThemeContext] Removed dark class from HTML');
    }
  }, [darkMode]);

  const setDarkMode = (enabled: boolean) => {
    console.log('[ThemeContext] setDarkMode called with:', enabled);
    setDarkModeState(enabled);
    localStorage.setItem('app_darkMode', enabled.toString());
    console.log('[ThemeContext] Saved to localStorage:', enabled.toString());
  };

  const toggleDarkMode = () => {
    console.log('[ThemeContext] toggleDarkMode called. Current darkMode:', darkMode);
    setDarkMode(!darkMode);
  };

  const value: ThemeContextType = {
    darkMode,
    toggleDarkMode,
    setDarkMode,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

/**
 * useTheme Hook
 *
 * Access theme context in components
 */
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
};

export default ThemeContext;
