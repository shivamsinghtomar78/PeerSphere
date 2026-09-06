'use client';

import { apiClient, clearAuth, getAccessToken, getRefreshToken, getStoredUser } from './api-client';
import { ApiResponse } from './api-client';

// User type matching backend AuthPayload
export interface User {
  id: string;
  email: string;
  role: 'STUDENT' | 'PLACEMENT_ADMIN';
}

// Login response from backend
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

// Auth state
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Login with email and password
 * Stores tokens and user data in localStorage
 */
export const login = async (email: string, password: string): Promise<LoginResponse> => {
  const response = await apiClient.post<ApiResponse<LoginResponse>>('/auth', {
    email,
    password,
  });

  const { accessToken, refreshToken, user } = response.data.data;

  // Store tokens and user in localStorage
  localStorage.setItem('peersphere_access_token', accessToken);
  localStorage.setItem('peersphere_refresh_token', refreshToken);
  localStorage.setItem('peersphere_user', JSON.stringify(user));

  return { accessToken, refreshToken, user };
};

/**
 * Logout - clears all auth data
 */
export const logout = (): void => {
  clearAuth();
};

/**
 * Refresh access token using refresh token
 * Returns new tokens and updates localStorage
 */
export const refreshToken = async (): Promise<{ accessToken: string; refreshToken: string } | null> => {
  const refreshToken = getRefreshToken();
  
  if (!refreshToken) {
    clearAuth();
    return null;
  }

  try {
    const response = await apiClient.post<ApiResponse<{ accessToken: string; refreshToken: string }>>(
      '/auth/refresh',
      { refreshToken }
    );

    const { accessToken, refreshToken: newRefreshToken } = response.data.data;

    localStorage.setItem('peersphere_access_token', accessToken);
    localStorage.setItem('peersphere_refresh_token', newRefreshToken);

    return { accessToken, refreshToken: newRefreshToken };
  } catch (error) {
    clearAuth();
    return null;
  }
};

/**
 * Get current user from localStorage
 * Also verifies token is still valid by checking if we have an access token
 */
export const getCurrentUser = (): User | null => {
  const accessToken = getAccessToken();
  const storedUser = getStoredUser();

  // If we have a token and user data, return the user
  if (accessToken && storedUser) {
    const role = storedUser.role === 'PLACEMENT_ADMIN' ? 'PLACEMENT_ADMIN' : 'STUDENT';
    return { id: storedUser.id, email: storedUser.email, role };
  }

  return null;
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  return getAccessToken() !== null;
};

/**
 * Initialize auth state on app load
 * Checks if we have valid tokens and optionally refreshes if needed
 */
export const initializeAuth = async (): Promise<AuthState> => {
  const user = getCurrentUser();
  const accessToken = getAccessToken();

  if (!accessToken) {
    return {
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    };
  }

  // If we have a token, we're authenticated
  // Note: The token validity will be checked by the API and auto-refreshed
  return {
    user,
    isAuthenticated: true,
    isLoading: false,
    error: null,
  };
};

/**
 * Get user role
 */
export const getUserRole = (): 'STUDENT' | 'PLACEMENT_ADMIN' | null => {
  const user = getCurrentUser();
  return user?.role ?? null;
};

/**
 * Check if user has specific role
 */
export const hasRole = (role: 'STUDENT' | 'PLACEMENT_ADMIN'): boolean => {
  const userRole = getUserRole();
  return userRole === role;
};

/**
 * Check if user has any of the specified roles
 */
export const hasAnyRole = (...roles: ('STUDENT' | 'PLACEMENT_ADMIN')[]): boolean => {
  const userRole = getUserRole();
  return userRole !== null && roles.includes(userRole);
};
