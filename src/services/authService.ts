/**
 * Authentication Service
 * 
 * Handles user authentication operations including login, registration,
 * password changes, and token management. Provides secure storage
 * and retrieval of authentication data.
 */

import apiClient from './apiClient';

/** User login credentials */
export interface LoginCredentials {
  /** User's email address */
  email: string;
  /** User's password */
  password: string;
}

/** User registration data */
export interface RegisterData {
  /** User's email address */
  email: string;
  /** Desired username */
  username: string;
  /** User's password */
  password: string;
}

/** Authenticated user data returned from server */
export interface AuthUser {
  /** Unique user ID */
  id: number;
  /** User's email address */
  email: string;
  /** User's username */
  username: string;
}

/** Authentication response from login/register */
export interface AuthResponse {
  /** Response message from server */
  message: string;
  /** Authenticated user data */
  user: AuthUser;
  /** JWT authentication token */
  token: string;
}

/** Password change request data */
export interface ChangePasswordData {
  /** User's current password */
  currentPassword: string;
  /** New password to set */
  newPassword: string;
}

/**
 * Authentication service providing user auth operations and token management.
 */
export const authService = {
  /**
   * Authenticates user with email and password.
   * @param credentials - User login credentials
   * @returns Promise resolving to authentication response with token and user data
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },

  /**
   * Registers a new user account.
   * @param userData - User registration data
   * @returns Promise resolving to authentication response with token and user data
   */
  async register(userData: RegisterData): Promise<AuthResponse> {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  },

  /**
   * Retrieves current user profile from server.
   * @returns Promise resolving to user profile data
   */
  async getProfile(): Promise<{ user: AuthUser }> {
    const response = await apiClient.get('/auth/profile');
    return response.data;
  },

  /**
   * Changes user's password.
   * @param data - Current and new password data
   * @returns Promise resolving to success message
   */
  async changePassword(data: ChangePasswordData): Promise<{ message: string }> {
    const response = await apiClient.put('/auth/change-password', data);
    return response.data;
  },

  /**
   * Logs out current user by clearing stored authentication data.
   */
  logout() {
    localStorage.removeItem('auth-token');
    localStorage.removeItem('auth-user');
  },

  /**
   * Retrieves stored authentication token from localStorage.
   * @returns Stored JWT token or null if not found
   */
  getStoredToken(): string | null {
    return localStorage.getItem('auth-token');
  },

  /**
   * Retrieves stored user data from localStorage.
   * @returns Stored user object or null if not found
   */
  getStoredUser(): AuthUser | null {
    const userStr = localStorage.getItem('auth-user');
    return userStr ? JSON.parse(userStr) : null;
  },

  /**
   * Stores authentication token and user data in localStorage.
   * @param token - JWT authentication token
   * @param user - User data object
   */
  storeAuthData(token: string, user: AuthUser) {
    localStorage.setItem('auth-token', token);
    localStorage.setItem('auth-user', JSON.stringify(user));
  }
};