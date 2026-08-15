'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, ApiResponse, ApiError as ApiErrorType, getErrorMessage } from '@/lib/api-client';

// Re-export router for use in other hooks
// This is needed because Next.js navigation hook must be used in client components
export { useRouter };

/**
 * Generic API request hook
 * 
 * Handles loading, error, and data states for API calls
 * Supports automatic cancellation of previous requests
 * 
 * @example
 * ```tsx
 * const { data, loading, error, request } = useApi<Job[]>('/jobs');
 * 
 * useEffect(() => {
 *   request();
 * }, []);
 * 
 * if (loading) return <Spinner />;
 * if (error) return <Error message={error} />;
 * return <JobList jobs={data} />;
 * ```
 */
export function useApi<T = unknown>(url: string, options?: RequestInit) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const request = useCallback(async (config?: RequestInit): Promise<T | null> => {
    // Cancel previous request if it exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.request<T>({
        url,
        method: options?.method || 'GET',
        data: options?.body ? JSON.parse(options.body as string) : undefined,
        params: options?.body && !options.method ? JSON.parse(options.body as string) : undefined,
        signal: controller.signal,
        ...options,
      });

      const result = response.data;
      
      // Handle both wrapped and unwrapped responses
      if (result && typeof result === 'object' && 'data' in result) {
        setData((result as ApiResponse<T>).data);
        return (result as ApiResponse<T>).data;
      } else {
        setData(result);
        return result;
      }
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      throw err;
    } finally {
      setLoading(false);
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  }, [url, options]);

  const reset = useCallback(() => {
    setData(null);
    setLoading(false);
    setError(null);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  return { data, loading, error, request, reset };
}

/**
 * Hook for GET requests
 * 
 * @example
 * ```tsx
 * const { data: jobs, loading, error } = useGet<Job[]>('/jobs');
 * ```
 */
export function useGet<T = unknown>(url: string, params?: Record<string, unknown>) {
  const { data, loading, error, request, reset } = useApi<T>(url, {
    method: 'GET',
    body: JSON.stringify(params),
  });

  return { data, loading, error, request, reset };
}

/**
 * Hook for POST requests
 * 
 * @example
 * ```tsx
 * const { data, loading, error, request } = usePost<Job>('/jobs');
 * 
 * const handleSubmit = async (jobData) => {
 *   await request({ body: jobData });
 * };
 * ```
 */
export function usePost<T = unknown>(url: string) {
  const { data, loading, error, request, reset } = useApi<T>(url, { method: 'POST' });

  return { data, loading, error, request, reset };
}

/**
 * Hook for PUT requests
 */
export function usePut<T = unknown>(url: string) {
  const { data, loading, error, request, reset } = useApi<T>(url, { method: 'PUT' });

  return { data, loading, error, request, reset };
}

/**
 * Hook for PATCH requests
 */
export function usePatch<T = unknown>(url: string) {
  const { data, loading, error, request, reset } = useApi<T>(url, { method: 'PATCH' });

  return { data, loading, error, request, reset };
}

/**
 * Hook for DELETE requests
 */
export function useDelete<T = unknown>(url: string) {
  const { data, loading, error, request, reset } = useApi<T>(url, { method: 'DELETE' });

  return { data, loading, error, request, reset };
}

/**
 * Type for paginated responses from backend
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
}

/**
 * Type for paginated query parameters
 */
export interface PaginatedQueryParams {
  page?: number;
  pageSize?: number;
}

/**
 * Hook for paginated GET requests
 * 
 * @example
 * ```tsx
 * const { data: jobs, loading, error, pagination } = usePaginatedGet<Job>('/jobs', { page: 1, pageSize: 10 });
 * ```
 */
export function usePaginatedGet<T = unknown>(
  url: string,
  params?: PaginatedQueryParams & Record<string, unknown>
) {
  const [pagination, setPagination] = useState<{
    page: number;
    pageSize: number;
    total: number;
    hasNext: boolean;
  } | null>(null);

  const { data, loading, error, request, reset } = useApi<PaginatedResponse<T>>(url, {
    method: 'GET',
    body: JSON.stringify(params),
  });

  // Extract pagination info when data changes
  useState(() => {
    if (data) {
      setPagination({
        page: data.page,
        pageSize: data.pageSize,
        total: data.total,
        hasNext: data.hasNext,
      });
    }
  }, [data]);

  return {
    data: data?.items ?? null,
    loading,
    error,
    pagination,
    request: (p?: PaginatedQueryParams) => request({ body: JSON.stringify(p) }),
    reset,
  };
}

/**
 * Simple hook for one-time API fetch on mount
 * 
 * @example
 * ```tsx
 * const { data: profile, loading, error } = useFetchOnMount<Student>('/students/me');
 * ```
 */
export function useFetchOnMount<T = unknown>(url: string, options?: RequestInit) {
  const { data, loading, error, request } = useApi<T>(url, options);

  useEffect(() => {
    request();
  }, []);

  return { data, loading, error };
}
