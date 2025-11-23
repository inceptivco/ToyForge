/**
 * CharacterForge SDK Client
 *
 * Main client for generating character images with built-in caching,
 * retry logic, and comprehensive error handling.
 */

import { CharacterConfig } from '../../types';
import { supabase } from '../supabase';
import { WebCacheManager } from './cache';
import { CacheManager, CharacterForgeClientConfig, GenerationResult } from './types';
import { sdkLogger } from '../../utils/logger';
import {
  ApiError,
  NetworkError,
  InsufficientCreditsError,
  AuthenticationError,
  GenerationError,
  RateLimitError,
} from '../../utils/errors';

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
 * Check if an error is retryable
 */
function isRetryableError(error: unknown): boolean {
  if (error instanceof NetworkError) return true;
  if (error instanceof RateLimitError) return true;

  if (error instanceof ApiError) {
    return RETRYABLE_STATUS_CODES.includes(error.statusCode);
  }

  // Check for network-related error messages
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('fetch')
    );
  }

  return false;
}

/**
 * Parse API response error into appropriate error class
 */
function parseApiError(error: unknown, data?: unknown): Error {
  // Handle Supabase function error with response data
  if (data && typeof data === 'object' && 'error' in data) {
    const errorData = data as { error: string };
    const message = errorData.error;

    if (message.includes('credits') || message.includes('Insufficient')) {
      return new InsufficientCreditsError();
    }

    if (message.includes('authentication') || message.includes('logged in')) {
      return new AuthenticationError(message);
    }

    return new GenerationError(message);
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes('credits') || message.includes('insufficient')) {
      return new InsufficientCreditsError();
    }

    if (message.includes('authentication') || message.includes('logged in') || message.includes('unauthorized')) {
      return new AuthenticationError(error.message);
    }

    if (message.includes('network') || message.includes('fetch')) {
      return new NetworkError(error.message);
    }

    return new GenerationError(error.message);
  }

  return new GenerationError('An unexpected error occurred');
}

// ============================================================================
// SDK Client Class
// ============================================================================

export class CharacterForgeClient {
  private cacheManager: CacheManager;
  private config: CharacterForgeClientConfig;
  private retryConfig: typeof DEFAULT_RETRY_CONFIG;

  constructor(config: CharacterForgeClientConfig = {}) {
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

export const characterForgeClient = new CharacterForgeClient();

// ============================================================================
// Factory Function for Custom Instances
// ============================================================================

export function createCharacterForgeClient(
  config?: CharacterForgeClientConfig
): CharacterForgeClient {
  return new CharacterForgeClient(config);
}
