'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { User, AuthState, login as loginApi, logout as logoutApi, getCurrentUser, initializeAuth } from '@/lib/auth';

// Extend window interface for custom events
declare global {
  interface Window {
    location: Location;
  }
}

// Action types for auth context
type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'RESTORE_SESSION'; payload: User | null };

// Auth context value type
interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

// Create context with undefined initial value
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Auth provider component
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // Initialize auth state on mount
  useEffect(() => {
    const init = async () => {
      try {
        const authState = await initializeAuth();
        setState({
          ...authState,
          isLoading: false,
        });
      } catch {
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: 'Failed to initialize authentication',
        });
      }
    };

    init();
  }, []);

  // Handle window focus - optionally check token validity
  useEffect(() => {
    const handleFocus = () => {
      // Re-check auth state when window regains focus
      const user = getCurrentUser();
      const isAuthenticated = !!user;
      
      setState((prev) => ({
        ...prev,
        user,
        isAuthenticated,
      }));
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Reducer function for auth actions
  const authReducer = (state: AuthState, action: AuthAction): AuthState => {
    switch (action.type) {
      case 'LOGIN_START':
        return { ...state, isLoading: true, error: null };
      case 'LOGIN_SUCCESS':
        return {
          user: action.payload,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        };
      case 'LOGIN_FAILURE':
        return {
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: action.payload,
        };
      case 'LOGOUT':
        return {
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        };
      case 'RESTORE_SESSION':
        return {
          user: action.payload,
          isAuthenticated: !!action.payload,
          isLoading: false,
          error: null,
        };
      default:
        return state;
    }
  };

  // Dispatch function wrapped in useState for simplicity
  const dispatch = (action: AuthAction) => {
    setState((prev) => authReducer(prev, action));
  };

  // Login function
  const login = async (email: string, password: string): Promise<void> => {
    dispatch({ type: 'LOGIN_START' });

    try {
      const { user } = await loginApi(email, password);
      dispatch({ type: 'LOGIN_SUCCESS', payload: user });

      // Redirect based on role. router.push is safe to call directly here —
      // React batches the state update with the navigation; the old
      // setTimeout(…, 100) only added a race with fast unmounts.
      if (user.role === 'STUDENT') {
        router.push('/student');
      } else if (user.role === 'PLACEMENT_ADMIN') {
        router.push('/placement');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      dispatch({ type: 'LOGIN_FAILURE', payload: message });
    }
  };

  // Logout function
  const logout = (): void => {
    logoutApi();
    dispatch({ type: 'LOGOUT' });
    router.push('/auth');
  };

  // Clear error function
  const clearError = (): void => {
    setState((prev) => ({ ...prev, error: null }));
  };

  // Context value
  const value: AuthContextValue = {
    ...state,
    login,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Export the context for testing
export { AuthContext };
