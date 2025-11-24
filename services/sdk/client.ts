/**
 * CharacterSmith SDK Client
 *
 * Main client for generating character images with built-in caching,
 * retry logic, and comprehensive error handling.
 */

import type { CharacterConfig, CacheManager, CharacterSmithClientConfig, GenerateOptions } from '../../types';
import { supabase } from '../supabase';
import { WebCacheManager } from './cache';
import { CacheManager, CharacterSmithClientConfig, GenerationResult } from './types';
import { sdkLogger } from '../../utils/logger';
import {
  ApiError,
  NetworkError,
  InsufficientCreditsError,
  AuthenticationError,
  GenerationError,
  RateLimitError,
} from '../../utils/errors';

// Re-export error classes for convenience
export {
  AuthenticationError,
  InsufficientCreditsError,
  GenerationError as CharacterSmithError,
};

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_RETRY_CONFIG = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
} as const;

const RETRYABLE_STATUS_CODES = [408, 429, 500, 502, 503, 504];

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate a stable cache key from configuration
 * Uses sorted keys to ensure deterministic key generation
 */
function generateCacheKey(config: CharacterConfig): string {
  const sortedKeys = Object.keys(config).sort();
  const stableObj: Record<string, unknown> = {};

  for (const key of sortedKeys) {
    // Exclude non-visual props that shouldn't affect cache
    if (key === 'cache') continue;
    stableObj[key] = config[key as keyof CharacterConfig];
  }

  return JSON.stringify(stableObj);
}

/**
 * Calculate exponential backoff delay with jitter
 */
function calculateBackoffDelay(attempt: number, baseDelay: number, maxDelay: number): number {
  const exponentialDelay = baseDelay * Math.pow(2, attempt);
  const jitter = Math.random() * 0.3 * exponentialDelay; // Add up to 30% jitter
  return Math.min(exponentialDelay + jitter, maxDelay);
}

/**
 * Wait for a specified duration
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if an error is retryable based on its type or status code
 */
function isRetryableError(error: unknown): boolean {
  if (error instanceof NetworkError) return true;
  if (error instanceof RateLimitError) return true;
  if (error instanceof ApiError) return true; // ApiError is only created for retryable status codes

  // Check for network-related error messages
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('fetch') ||
      message.includes('failed to fetch')
    );
  }

  return false;
}

/**
 * Extract HTTP status code from Supabase function error
 */
function extractStatusCode(error: unknown): number | null {
  if (!error || typeof error !== 'object') return null;

  // Supabase FunctionsHttpError has a status property
  const err = error as Record<string, unknown>;

  // Check for status directly on error
  if (typeof err.status === 'number') return err.status;

  // Check for context.status (Supabase edge function error format)
  if (err.context && typeof err.context === 'object') {
    const context = err.context as Record<string, unknown>;
    if (typeof context.status === 'number') return context.status;
  }

  return null;
}

/**
 * Parse API response error into appropriate error class
 * Now properly handles HTTP status codes for retry logic
 */
function parseApiError(error: unknown, data?: unknown): Error {
  // Extract status code from error object
  const statusCode = extractStatusCode(error);

  // Get error message from response data or error object
  let message = 'An unexpected error occurred';

  if (data && typeof data === 'object' && 'error' in data) {
    message = (data as { error: string }).error;
  } else if (error instanceof Error) {
    message = error.message;
  }

  const messageLower = message.toLowerCase();

  // Check for specific non-retryable error types first
  if (messageLower.includes('credits') || messageLower.includes('insufficient') || statusCode === 402) {
    return new InsufficientCreditsError();
  }

  if (messageLower.includes('authentication') || messageLower.includes('logged in') ||
      messageLower.includes('unauthorized') || statusCode === 401) {
    return new AuthenticationError(message);
  }

  // Check for rate limiting (429)
  if (statusCode === 429) {
    return new RateLimitError();
  }

  // Check for retryable server errors (5xx) or timeout (408)
  if (statusCode && RETRYABLE_STATUS_CODES.includes(statusCode)) {
    return new ApiError(message, statusCode, 'generate-character');
  }

  // Check for network-related errors
  if (messageLower.includes('network') || messageLower.includes('fetch') ||
      messageLower.includes('failed to fetch')) {
    return new NetworkError(message);
  }

  // Default to GenerationError for other failures
  return new GenerationError(message);
}

// ============================================================================
// SDK Client Class
// ============================================================================

export class CharacterSmithClient {
  private cacheManager: CacheManager;
  private config: CharacterSmithClientConfig;
  private retryConfig: typeof DEFAULT_RETRY_CONFIG;

  constructor(config: CharacterSmithClientConfig = {}) {
    this.config = {
      cache: true, // Default to enabled
      ...config,
    };

    this.retryConfig = DEFAULT_RETRY_CONFIG;

    // In a universal SDK, we'd detect platform here
    // For now, default to WebCacheManager for browser environment
    this.cacheManager = new WebCacheManager();

    sdkLogger.info('SDK Client initialized', {
      cacheEnabled: this.config.cache,
    });
  }

  /**
   * Generate a character image based on the configuration
   * Includes caching, retry logic, and comprehensive error handling
   */
  async generate(
    characterConfig: CharacterConfig,
    onStatusUpdate?: (status: string) => void
  ): Promise<string> {
    const shouldCache = this.config.cache && characterConfig.cache !== false;
    const cacheKey = generateCacheKey(characterConfig);

    sdkLogger.debug('Starting generation', {
      shouldCache,
      gender: characterConfig.gender,
    });

    // Check cache first
    if (shouldCache) {
      try {
        const cachedUrl = await this.cacheManager.get(cacheKey);
        if (cachedUrl) {
          sdkLogger.info('Cache hit');
          onStatusUpdate?.('Retrieved from Client Cache!');
          return cachedUrl;
        }
        sdkLogger.debug('Cache miss');
      } catch (cacheError) {
        sdkLogger.warn('Cache lookup failed', { error: cacheError });
        // Continue with API call on cache failure
      }
    }

    // Call API with retry logic
    onStatusUpdate?.('Calling AI Cloud...');
    const imageUrl = await this.callApiWithRetry(characterConfig);

    // Cache the result
    if (shouldCache && imageUrl) {
      await this.cacheResult(cacheKey, imageUrl, onStatusUpdate);
    }

    return imageUrl;
  }

  /**
   * Call the generation API with retry logic
   */
  private async callApiWithRetry(config: CharacterConfig): Promise<string> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        sdkLogger.debug('API call attempt', { attempt: attempt + 1 });

        const { data, error } = await supabase.functions.invoke('generate-character', {
          body: config,
        });

        // Handle errors
        if (error || (data && typeof data === 'object' && 'error' in data)) {
          const parsedError = parseApiError(error, data);

          // Don't retry authentication or credit errors
          if (parsedError instanceof AuthenticationError ||
              parsedError instanceof InsufficientCreditsError) {
            throw parsedError;
          }

          throw parsedError;
        }

        if (!data?.image) {
          throw new GenerationError('No image URL in response');
        }

        sdkLogger.info('Generation successful', {
          attempt: attempt + 1,
        });

        return data.image;

      } catch (error) {
        lastError = error instanceof Error ? error : new GenerationError('Unknown error');

        // Check if we should retry
        if (attempt < this.retryConfig.maxRetries && isRetryableError(error)) {
          const delayMs = calculateBackoffDelay(
            attempt,
            this.retryConfig.baseDelayMs,
            this.retryConfig.maxDelayMs
          );

          sdkLogger.warn('Retrying after error', {
            attempt: attempt + 1,
            delayMs,
            error: lastError.message,
          });

          await delay(delayMs);
          continue;
        }

        // No more retries or non-retryable error
        throw lastError;
      }
    }

    // Should not reach here, but TypeScript needs this
    throw lastError || new GenerationError('Generation failed after retries');
  }

  /**
   * Cache the generation result
   */
  private async cacheResult(
    cacheKey: string,
    imageUrl: string,
    onStatusUpdate?: (status: string) => void
  ): Promise<string | null> {
    try {
      onStatusUpdate?.('Caching result...');
      await this.cacheManager.set(cacheKey, imageUrl);

      // Return cached URL for consistency
      const cachedUrl = await this.cacheManager.get(cacheKey);
      if (cachedUrl) {
        sdkLogger.debug('Result cached successfully');
        return cachedUrl;
      }
    } catch (cacheError) {
      sdkLogger.warn('Failed to cache image', { error: cacheError });
    }

    return null;
  }

  /**
   * Clear the local cache
   */
  async clearCache(): Promise<void> {
    sdkLogger.info('Clearing cache');
    await this.cacheManager.clear();
  }

  /**
   * Get cache statistics (if supported by cache manager)
   */
  async getCacheStats(): Promise<{ size: number } | null> {
    // This could be extended to provide more detailed stats
    return null;
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const characterSmithClient = new CharacterSmithClient();

// ============================================================================
// Factory Function for Custom Instances
// ============================================================================

export function createCharacterSmithClient(
  config?: CharacterSmithClientConfig
): CharacterSmithClient {
  return new CharacterSmithClient(config);
}
