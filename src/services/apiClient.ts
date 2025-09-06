/**
 * API Client Service
 * 
 * Centralized HTTP client configuration using Axios.
 * Handles authentication tokens, request/response interceptors,
 * and automatic token-based authentication for all API calls.
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/**
 * Pre-configured Axios instance for API communication.
 * Automatically includes authentication headers and handles common scenarios.
 */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isAuthRequest = error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/register');
      
      if (!isAuthRequest) {
        localStorage.removeItem('auth-token');
        localStorage.removeItem('auth-user');
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;