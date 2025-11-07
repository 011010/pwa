/**
 * Authentication Context
 *
 * Provides authentication state and methods throughout the application.
 * Handles login, logout, and persists user session.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User, LoginCredentials } from '../types';
import { authService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Auth Provider Component
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  /**
   * Initialize auth state on mount
   */
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Check if user is authenticated
        if (authService.isAuthenticated()) {
          // Load user from local storage
          const storedUser = authService.getCurrentUser();
          if (storedUser) {
            setUser(storedUser);
          } else {
            // Fetch user from API if not in storage
            const currentUser = await authService.fetchCurrentUser();
            setUser(currentUser);
          }
        }
      } catch (error) {
        console.error('[Auth Context] Failed to initialize auth:', error);
        // Clear invalid session
        await authService.logout();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  /**
   * Listen for auth events
   */
  useEffect(() => {
    const handleAuthLogin = (event: Event) => {
      const customEvent = event as CustomEvent<User>;
      setUser(customEvent.detail);
    };

    const handleAuthLogout = () => {
      setUser(null);
      navigate('/login', { replace: true });
    };

    window.addEventListener('auth:login', handleAuthLogin);
    window.addEventListener('auth:logout', handleAuthLogout);

    return () => {
      window.removeEventListener('auth:login', handleAuthLogin);
      window.removeEventListener('auth:logout', handleAuthLogout);
    };
  }, [navigate]);

  /**
   * Login user
   */
  const login = useCallback(async (credentials: LoginCredentials): Promise<void> => {
    try {
      setIsLoading(true);
      const response = await authService.login(credentials);
      setUser(response.data.user);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      console.error('[Auth Context] Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  /**
   * Logout user
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      await authService.logout();
      setUser(null);
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('[Auth Context] Logout failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  /**
   * Refresh user data from API
   */
  const refreshUser = useCallback(async (): Promise<void> => {
    try {
      const currentUser = await authService.fetchCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('[Auth Context] Failed to refresh user:', error);
      throw error;
    }
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * useAuth Hook
 *
 * Access authentication context in components
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};

/**
 * Protected Route Component
 *
 * Redirects to login if user is not authenticated
 */
interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};

export default AuthContext;
