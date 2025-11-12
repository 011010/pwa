/**
 * API Service Layer
 *
 * Handles all HTTP communication with the Filament API backend.
 * Includes JWT authentication, request/response interceptors, and error handling.
 */

import axios, { AxiosError } from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { config } from '../config/environment';
import type { ApiError } from '../types';

/**
 * Create configured axios instance
 */
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: config.apiUrl,
    timeout: config.apiTimeout,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  // Request interceptor - Add JWT token to all requests
  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = localStorage.getItem('itam_auth_token');

      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Log request in development
      if (import.meta.env.DEV) {
        console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, config.data);
      }

      return config;
    },
    (error) => {
      console.error('[API Request Error]', error);
      return Promise.reject(error);
    }
  );

  // Response interceptor - Handle common errors and token expiration
  client.interceptors.response.use(
    (response) => {
      // Log response in development
      if (import.meta.env.DEV) {
        console.log(`[API Response] ${response.config.url}`, response.data);
      }
      return response;
    },
    async (error: AxiosError<ApiError>) => {
      const originalRequest = error.config;

      // Handle 401 Unauthorized - Token expired
      if (error.response?.status === 401 && originalRequest) {
        // Clear auth data and redirect to login
        localStorage.removeItem(config.tokenKey);
        localStorage.removeItem(config.userKey);
        localStorage.removeItem(config.tokenExpiryKey);

        // Dispatch custom event for auth state change
        window.dispatchEvent(new CustomEvent('auth:logout'));

        return Promise.reject(error);
      }

      // Handle 403 Forbidden
      if (error.response?.status === 403) {
        console.error('[API] Access forbidden:', error.response.data);
      }

      // Handle network errors
      if (!error.response) {
        console.error('[API] Network error:', error.message);
        return Promise.reject({
          message: 'Network error. Please check your internet connection.',
          status: 0,
        });
      }

      // Format error for consistent handling
      const apiError: ApiError = {
        message: error.response.data?.message || 'An unexpected error occurred',
        errors: error.response.data?.errors,
        status: error.response.status,
      };

      console.error('[API Error]', apiError);
      return Promise.reject(apiError);
    }
  );

  return client;
};

// Export configured API client
export const apiClient = createApiClient();

/**
 * API Helper Functions
 *
 * These functions handle the Filament API response format:
 * { success: boolean, message?: string, data: T, meta?: {...}, links?: {...} }
 */
export const api = {
  /**
   * GET request - Returns full response object for pagination support
   */
  get: async <T>(url: string, params?: Record<string, any>): Promise<T> => {
    const response = await apiClient.get<T>(url, { params });
    return response.data;
  },

  /**
   * POST request - Returns full response object
   */
  post: async <T>(url: string, data?: any): Promise<T> => {
    const response = await apiClient.post<T>(url, data);
    return response.data;
  },

  /**
   * PUT request - Returns full response object
   */
  put: async <T>(url: string, data?: any): Promise<T> => {
    const response = await apiClient.put<T>(url, data);
    return response.data;
  },

  /**
   * PATCH request - Returns full response object
   */
  patch: async <T>(url: string, data?: any): Promise<T> => {
    const response = await apiClient.patch<T>(url, data);
    return response.data;
  },

  /**
   * DELETE request - Returns full response object
   */
  delete: async <T>(url: string): Promise<T> => {
    const response = await apiClient.delete<T>(url);
    return response.data;
  },

  /**
   * Upload file with multipart/form-data
   */
  upload: async <T>(url: string, file: File, additionalData?: Record<string, any>, fieldName: string = 'file'): Promise<T> => {
    const formData = new FormData();
    formData.append(fieldName, file);

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    const response = await apiClient.post<T>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },
};

/**
 * Set authentication token
 */
export const setAuthToken = (token: string): void => {
  localStorage.setItem(config.tokenKey, token);
  apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

/**
 * Clear authentication token
 */
export const clearAuthToken = (): void => {
  localStorage.removeItem(config.tokenKey);
  localStorage.removeItem(config.userKey);
  delete apiClient.defaults.headers.common['Authorization'];
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  const token = localStorage.getItem(config.tokenKey);
  const user = localStorage.getItem(config.userKey);
  return !!(token && user);
};

/**
 * Health check endpoint
 */
export const healthCheck = async (): Promise<{ status: string; timestamp: string; service: string }> => {
  try {
    const response = await apiClient.get<{ status: string; timestamp: string; service: string }>('/health');
    return response.data;
  } catch (error) {
    console.error('[API] Health check failed:', error);
    throw error;
  }
};

export default api;
