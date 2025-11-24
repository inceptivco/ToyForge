/**
 * Async Data Hooks
 *
 * Provides reusable hooks for async operations with proper loading,
 * error handling, and cleanup.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { AsyncState } from '../types';

/**
 * Hook for managing async function calls with loading and error states
 */
export function useAsync<T, Args extends unknown[]>(
  asyncFunction: (...args: Args) => Promise<T>
): AsyncState<T> & {
  execute: (...args: Args) => Promise<T | null>;
  reset: () => void;
} {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    isLoading: false,
    error: null,
  });

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const execute = useCallback(
    async (...args: Args): Promise<T | null> => {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      try {
        const result = await asyncFunction(...args);

        if (mountedRef.current) {
          setState({ data: result, isLoading: false, error: null });
        }

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An error occurred';

        if (mountedRef.current) {
          setState({ data: null, isLoading: false, error: errorMessage });
        }

        return null;
      }
    },
    [asyncFunction]
  );

  const reset = useCallback(() => {
    setState({ data: null, isLoading: false, error: null });
  }, []);

  return { ...state, execute, reset };
}

/**
 * Hook for polling data at regular intervals with automatic cleanup
 */
export function usePolling<T>(
  fetchFunction: () => Promise<T>,
  intervalMs: number,
  options: {
    enabled?: boolean;
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
    immediate?: boolean;
  } = {}
): AsyncState<T> & { refresh: () => Promise<void> } {
  const { enabled = true, onSuccess, onError, immediate = true } = options;

  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    isLoading: false,
    error: null,
  });

  const mountedRef = useRef(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    if (!mountedRef.current) return;

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const result = await fetchFunction();

      if (mountedRef.current) {
        setState({ data: result, isLoading: false, error: null });
        onSuccess?.(result);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');

      if (mountedRef.current) {
        setState(prev => ({ ...prev, isLoading: false, error: err.message }));
        onError?.(err);
      }
    }
  }, [fetchFunction, onSuccess, onError]);

  useEffect(() => {
    mountedRef.current = true;

    if (!enabled) {
      return;
    }

    if (immediate) {
      fetchData();
    }

    intervalRef.current = setInterval(fetchData, intervalMs);

    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, fetchData, immediate, intervalMs]);

  const refresh = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  return { ...state, refresh };
}

/**
 * Hook for debounced async operations
 */
export function useDebouncedAsync<T, Args extends unknown[]>(
  asyncFunction: (...args: Args) => Promise<T>,
  delayMs: number
): AsyncState<T> & { execute: (...args: Args) => void } {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    isLoading: false,
    error: null,
  });

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const execute = useCallback(
    (...args: Args) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      setState(prev => ({ ...prev, isLoading: true }));

      timeoutRef.current = setTimeout(async () => {
        try {
          const result = await asyncFunction(...args);

          if (mountedRef.current) {
            setState({ data: result, isLoading: false, error: null });
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'An error occurred';

          if (mountedRef.current) {
            setState({ data: null, isLoading: false, error: errorMessage });
          }
        }
      }, delayMs);
    },
    [asyncFunction, delayMs]
  );

  return { ...state, execute };
}

/**
 * Hook for retry logic with exponential backoff
 */
export function useRetry<T>(
  asyncFunction: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelayMs?: number;
    maxDelayMs?: number;
    backoffMultiplier?: number;
  } = {}
): AsyncState<T> & { execute: () => Promise<T | null>; retryCount: number } {
  const {
    maxRetries = 3,
    initialDelayMs = 1000,
    maxDelayMs = 30000,
    backoffMultiplier = 2,
  } = options;

  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    isLoading: false,
    error: null,
  });

  const [retryCount, setRetryCount] = useState(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const execute = useCallback(async (): Promise<T | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    setRetryCount(0);

    let currentDelay = initialDelayMs;
    let attempts = 0;

    while (attempts <= maxRetries) {
      try {
        const result = await asyncFunction();

        if (mountedRef.current) {
          setState({ data: result, isLoading: false, error: null });
        }

        return result;
      } catch (error) {
        attempts++;
        setRetryCount(attempts);

        if (attempts > maxRetries) {
          const errorMessage = error instanceof Error ? error.message : 'An error occurred';

          if (mountedRef.current) {
            setState({ data: null, isLoading: false, error: errorMessage });
          }

          return null;
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, currentDelay));
        currentDelay = Math.min(currentDelay * backoffMultiplier, maxDelayMs);
      }
    }

    return null;
  }, [asyncFunction, maxRetries, initialDelayMs, maxDelayMs, backoffMultiplier]);

  return { ...state, execute, retryCount };
}
