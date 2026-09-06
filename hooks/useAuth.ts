'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth as useAuthContext } from '@/context/AuthContext';

/**
 * Custom hook for accessing authentication state and methods
 * 
 * Returns the full auth context including:
 * - user: Current authenticated user or null
 * - isAuthenticated: Boolean indicating if user is logged in
 * - isLoading: Boolean indicating if auth is being initialized
 * - error: Any auth-related error message
 * - login: Function to login with email and password
 * - logout: Function to logout
 * - clearError: Function to clear auth errors
 * 
 * @example
 * ```tsx
 * const { user, isAuthenticated, login, logout } = useAuth();
 * 
 * if (isAuthenticated) {
 *   return <p>Welcome, {user?.email}</p>;
 * }
 * ```
 */
export const useAuth = () => {
  const context = useAuthContext();
  return context;
};

/**
 * Hook to check if user has a specific role
 * 
 * @param role - The role to check for
 * @returns Boolean indicating if user has the specified role
 * 
 * @example
 * ```tsx
 * const isAdmin = useHasRole('PLACEMENT_ADMIN');
 * if (isAdmin) {
 *   return <AdminPanel />;
 * }
 * ```
 */
export const useHasRole = (role: 'STUDENT' | 'PLACEMENT_ADMIN'): boolean => {
  const { user } = useAuth();
  return user?.role === role;
};

/**
 * Hook to check if user has any of the specified roles
 * 
 * @param roles - Array of roles to check
 * @returns Boolean indicating if user has any of the specified roles
 * 
 * @example
 * ```tsx
 * const isStaff = useHasAnyRole('PLACEMENT_ADMIN', 'STUDENT');
 * ```
 */
export const useHasAnyRole = (...roles: ('STUDENT' | 'PLACEMENT_ADMIN')[]): boolean => {
  const { user } = useAuth();
  return user !== null && roles.includes(user.role);
};

/**
 * Hook that redirects if user is not authenticated
 * Use this in pages that require authentication
 * 
 * @param redirectTo - Path to redirect to if not authenticated (default: '/auth')
 * @returns The current auth state
 * 
 * @example
 * ```tsx
 * // In a page component
 * const { user } = useRequireAuth();
 * // If not authenticated, will redirect to /auth
 * ```
 */
export const useRequireAuth = (redirectTo: string = '/auth'): ReturnType<typeof useAuth> => {
  const router = useRouter();
  const auth = useAuth();

  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      router.push(redirectTo);
    }
  }, [auth.isLoading, auth.isAuthenticated, router, redirectTo]);

  return auth;
};

/**
 * Hook that redirects if user IS authenticated
 * Use this in pages that should only be visible to unauthenticated users (login page)
 * 
 * @param redirectTo - Path to redirect to if authenticated (default: '/student' or '/placement' based on role)
 * @returns The current auth state
 * 
 * @example
 * ```tsx
 * // In login page
 * const { user } = useRequireUnauth('/dashboard');
 * // If authenticated, will redirect to /dashboard
 * ```
 */
export const useRequireUnauth = (redirectTo?: string): ReturnType<typeof useAuth> => {
  const router = useRouter();
  const auth = useAuth();

  useEffect(() => {
    if (!auth.isLoading && auth.isAuthenticated) {
      // Redirect based on role if no specific redirect is provided
      if (redirectTo) {
        router.push(redirectTo);
      } else if (auth.user) {
        const path = auth.user.role === 'STUDENT' ? '/student' : '/placement';
        router.push(path);
      }
    }
  }, [auth.isLoading, auth.isAuthenticated, auth.user, router, redirectTo]);

  return auth;
};

// Re-export useAuth from context for convenience
export { useAuth as useAuthContext } from '@/context/AuthContext';
