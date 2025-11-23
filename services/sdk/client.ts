/**
 * CharacterForge SDK Client
 *
 * A robust client for generating character images with proper caching,
 * error handling, and retry logic.
 */

import type { CharacterConfig, CacheManager, CharacterForgeClientConfig, GenerateOptions } from '../../types';
import { supabase } from '../supabase';
import { WebCacheManager } from './cache';

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_CONFIG: Required<Omit<CharacterForgeClientConfig, 'apiKey'>> = {
  cache: true,
  baseUrl: '',
  timeout: 60000, // 60 seconds
  retries: 2,
};

const RETRY_DELAYS = [1000, 2000, 4000]; // Exponential backoff delays in ms

// =============================================================================
// Error Classes
// =============================================================================

export class CharacterForgeError extends Error {
  public readonly code: string;
  public readonly isRetryable: boolean;

  constructor(message: string, code: string, isRetryable: boolean = false) {
    super(message);
    this.name = 'CharacterForgeError';
    this.code = code;
    this.isRetryable = isRetryable;
  }
}

export class AuthenticationError extends CharacterForgeError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTH_ERROR', false);
    this.name = 'AuthenticationError';
  }
}

export class InsufficientCreditsError extends CharacterForgeError {
  constructor(message: string = 'Insufficient credits') {
    super(message, 'INSUFFICIENT_CREDITS', false);
    this.name = 'InsufficientCreditsError';
  }
}

export class GenerationError extends CharacterForgeError {
  constructor(message: string, isRetryable: boolean = true) {
    super(message, 'GENERATION_ERROR', isRetryable);
    this.name = 'GenerationError';
  }
}

export class NetworkError extends CharacterForgeError {
  constructor(message: string = 'Network error') {
    super(message, 'NETWORK_ERROR', true);
    this.name = 'NetworkError';
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function parseError(error: unknown, data: unknown): CharacterForgeError {
  // Extract error message from response data
  let errorMessage = 'An unexpected error occurred';

  if (data && typeof data === 'object' && 'error' in data) {
    const dataError = (data as { error: unknown }).error;
    if (typeof dataError === 'string') {
      errorMessage = dataError;
    }
  } else if (error && typeof error === 'object' && 'message' in error) {
    errorMessage = (error as { message: string }).message;
  }

  // Classify the error
  const lowerMessage = errorMessage.toLowerCase();

  if (lowerMessage.includes('logged in') || lowerMessage.includes('authentication')) {
    return new AuthenticationError(errorMessage);
  }

  if (lowerMessage.includes('credit') || lowerMessage.includes('insufficient')) {
    return new InsufficientCreditsError(errorMessage);
  }

  if (lowerMessage.includes('network') || lowerMessage.includes('fetch')) {
    return new NetworkError(errorMessage);
  }

  return new GenerationError(errorMessage, true);
}

// =============================================================================
// Client Class
// =============================================================================

export class CharacterForgeClient {
  private readonly cacheManager: CacheManager;
  private readonly config: Required<Omit<CharacterForgeClientConfig, 'apiKey'>>;

  constructor(config: CharacterForgeClientConfig = {}) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
    };

    // Initialize cache manager (web by default, can be swapped for React Native)
    this.cacheManager = new WebCacheManager();
  }

  /**
   * Generates a character image based on the configuration.
   * Checks local cache first if enabled.
   */
  async generate(
    characterConfig: CharacterConfig,
    options: GenerateOptions = {}
  ): Promise<string> {
    const { signal, onProgress } = options;

    // Determine if caching should be used
    const shouldCache = this.config.cache && characterConfig.cache !== false;
    const cacheKey = this.generateCacheKey(characterConfig);

    // Check cache first
    if (shouldCache) {
      try {
        const cachedUrl = await this.cacheManager.get(cacheKey);
        if (cachedUrl) {
          onProgress?.('Retrieved from cache');
          return cachedUrl;
        }
      } catch (cacheError) {
        console.warn('[CharacterForgeClient] Cache lookup failed:', cacheError);
      }
    }

    // Make the API request with retries
    onProgress?.('Generating character...');
    const imageUrl = await this.executeWithRetry(
      () => this.callGenerateEndpoint(characterConfig, signal),
      onProgress
    );

    // Cache the result
    if (shouldCache && imageUrl) {
      try {
        onProgress?.('Caching result...');
        await this.cacheManager.set(cacheKey, imageUrl);

        // Return the cached URL for consistency
        const cachedUrl = await this.cacheManager.get(cacheKey);
        if (cachedUrl) {
          return cachedUrl;
        }
      } catch (cacheError) {
        console.warn('[CharacterForgeClient] Cache storage failed:', cacheError);
      }
    }

    onProgress?.('Generation complete');
    return imageUrl;
  }

  /**
   * Execute a function with retry logic
   */
  private async executeWithRetry<T>(
    fn: () => Promise<T>,
    onProgress?: (status: string) => void
  ): Promise<T> {
    let lastError: CharacterForgeError | null = null;

    for (let attempt = 0; attempt <= this.config.retries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof CharacterForgeError
          ? error
          : parseError(error, null);

        // Don't retry non-retryable errors
        if (!lastError.isRetryable) {
          throw lastError;
        }

        // Don't retry if we've exhausted attempts
        if (attempt >= this.config.retries) {
          throw lastError;
        }

        // Wait before retrying
        const delay = RETRY_DELAYS[Math.min(attempt, RETRY_DELAYS.length - 1)];
        onProgress?.(`Retrying in ${delay / 1000}s (attempt ${attempt + 2}/${this.config.retries + 1})...`);
        await sleep(delay);
      }
    }

    throw lastError || new GenerationError('Max retries exceeded');
  }

  /**
   * Call the generate-character edge function
   */
  private async callGenerateEndpoint(
    config: CharacterConfig,
    signal?: AbortSignal
  ): Promise<string> {
    // Check for abort before starting
    if (signal?.aborted) {
      throw new GenerationError('Request cancelled', false);
    }

    const { data, error } = await supabase.functions.invoke('generate-character', {
      body: config,
    });

    // Check for abort after request
    if (signal?.aborted) {
      throw new GenerationError('Request cancelled', false);
    }

    // Handle errors
    if (error || (data && typeof data === 'object' && 'error' in data)) {
      throw parseError(error, data);
    }

    if (!data?.image) {
      throw new GenerationError('No image returned from server');
    }

    return data.image;
  }

  /**
   * Generate a deterministic cache key from the config
   */
  private generateCacheKey(config: CharacterConfig): string {
    // Sort keys and exclude non-visual properties
    const visualConfig: Partial<CharacterConfig> = {
      gender: config.gender,
      skinTone: config.skinTone,
      hairStyle: config.hairStyle,
      hairColor: config.hairColor,
      clothing: config.clothing,
      clothingColor: config.clothingColor,
      eyeColor: config.eyeColor,
      accessories: [...config.accessories].sort(),
      transparent: config.transparent,
    };

    return JSON.stringify(visualConfig);
  }

  /**
   * Clear all cached images
   */
  async clearCache(): Promise<void> {
    await this.cacheManager.clear();
  }

  /**
   * Get cache statistics (if supported by the cache manager)
   */
  getCacheStats(): { enabled: boolean } {
    return {
      enabled: this.config.cache,
    };
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

export const characterForgeClient = new CharacterForgeClient();

// Re-export types for convenience
export type { CharacterConfig, CharacterForgeClientConfig, GenerateOptions };
