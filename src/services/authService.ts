import apiClient from './apiClient';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
}

export interface AuthUser {
  id: number;
  email: string;
  username: string;
}

export interface AuthResponse {
  message: string;
  user: AuthUser;
  token: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },

  async register(userData: RegisterData): Promise<AuthResponse> {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  },

  async getProfile(): Promise<{ user: AuthUser }> {
    const response = await apiClient.get('/auth/profile');
    return response.data;
  },

  async changePassword(data: ChangePasswordData): Promise<{ message: string }> {
    const response = await apiClient.put('/auth/change-password', data);
    return response.data;
  },

  logout() {
    localStorage.removeItem('auth-token');
    localStorage.removeItem('auth-user');
  },

  getStoredToken(): string | null {
    return localStorage.getItem('auth-token');
  },

  getStoredUser(): AuthUser | null {
    const userStr = localStorage.getItem('auth-user');
    return userStr ? JSON.parse(userStr) : null;
  },

  storeAuthData(token: string, user: AuthUser) {
    localStorage.setItem('auth-token', token);
    localStorage.setItem('auth-user', JSON.stringify(user));
  }
};