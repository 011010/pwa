/**
 * Authentication Service
 *
 * Handles user authentication, login, logout, and session management.
 */

import { api, setAuthToken, clearAuthToken } from './api';
import { config, endpoints } from '../config/environment';
import type { User, LoginCredentials, AuthResponse } from '../types';

/**
 * Login user with credentials
 */
export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  try {
    // Add device_name if not provided
    const loginData = {
      ...credentials,
      device_name: credentials.device_name || 'pwa-mobile-app'
    };

    const response = await api.post<AuthResponse>(endpoints.auth.login, loginData);

    if (!response.success) {
      throw new Error(response.message || 'Login failed');
    }

    // Store auth data
    localStorage.setItem(config.tokenKey, response.data.token);
    localStorage.setItem(config.userKey, JSON.stringify(response.data.user));

    // Set token in API client
    setAuthToken(response.data.token);

    // Dispatch custom event for auth state change
    window.dispatchEvent(new CustomEvent('auth:login', { detail: response.data.user }));

    return response;
  } catch (error) {
    console.error('[Auth Service] Login failed:', error);
    throw error;
  }
};

/**
 * Logout current user
 */
export const logout = async (): Promise<void> => {
  try {
    // Call logout endpoint
    await api.post(endpoints.auth.logout);
  } catch (error) {
    console.error('[Auth Service] Logout API call failed:', error);
    // Continue with local cleanup even if API call fails
  } finally {
    // Clear local auth data
    clearAuthToken();

    // Dispatch custom event for auth state change
    window.dispatchEvent(new CustomEvent('auth:logout'));
  }
};

/**
 * Get current authenticated user
 */
export const getCurrentUser = (): User | null => {
  try {
    const userStr = localStorage.getItem(config.userKey);
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('[Auth Service] Failed to parse user data:', error);
    return null;
  }
};

/**
 * Fetch user profile from API
 */
export const fetchCurrentUser = async (): Promise<User> => {
  try {
    const response = await api.get<{ success: boolean; data: User }>(endpoints.auth.user);

    if (!response.success) {
      throw new Error('Failed to fetch user');
    }

    const user = response.data;

    // Update stored user data
    localStorage.setItem(config.userKey, JSON.stringify(user));

    return user;
  } catch (error) {
    console.error('[Auth Service] Failed to fetch current user:', error);
    throw error;
  }
};

/**
 * Logout from all devices
 */
export const logoutAllDevices = async (): Promise<void> => {
  try {
    await api.post(endpoints.auth.logoutAll);
  } catch (error) {
    console.error('[Auth Service] Logout all devices failed:', error);
    throw error;
  } finally {
    clearAuthToken();
    window.dispatchEvent(new CustomEvent('auth:logout'));
  }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  const token = localStorage.getItem(config.tokenKey);
  const user = localStorage.getItem(config.userKey);

  // Simple check: token and user must exist
  return !!(token && user);
};

export const authService = {
  login,
  logout,
  logoutAllDevices,
  getCurrentUser,
  fetchCurrentUser,
  isAuthenticated,
};

export default authService;
