/**
 * SDK Type Definitions
 *
 * Types for the CharacterSmith SDK client and cache system.
 */

import { CharacterConfig } from '../../types';

// Re-export for convenience
export type { CharacterConfig };

// ============================================================================
// Cache Types
// ============================================================================

/**
 * Interface for cache manager implementations
 * Allows different storage backends (IndexedDB, AsyncStorage, etc.)
 */
export interface CacheManager {
  /**
   * Get a cached value by key
   * @returns The cached URL or null if not found
   */
  get(key: string): Promise<string | null>;

  /**
   * Store a value in the cache
   * @param key - The cache key
   * @param data - The image data (Blob or URL string)
   * @returns The local URL for the cached data
   */
  set(key: string, data: Blob | string): Promise<string>;

  /**
   * Clear all cached data
   */
  clear(): Promise<void>;
}

// ============================================================================
// Generation Types
// ============================================================================

/**
 * Result of a character generation
 */
export interface GenerationResult {
  /** URL to the generated image (local blob URL or remote URL) */
  image: string;
  /** Whether the result was retrieved from cache */
  cached: boolean;
  /** Time taken for generation in milliseconds (if not cached) */
  durationMs?: number;
}

// ============================================================================
// Client Configuration
// ============================================================================

/**
 * Configuration options for the SDK client
 */
export interface CharacterSmithClientConfig {
  /** API key for direct API access (future use) */
  apiKey?: string;
  /** Enable/disable client-side caching (default: true) */
  cache?: boolean;
  /** Custom cache manager implementation */
  cacheManager?: CacheManager;
  /** Retry configuration */
  retry?: RetryConfig;
}

/**
 * Retry configuration for API calls
 */
export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxRetries: number;
  /** Base delay in milliseconds for exponential backoff */
  baseDelayMs: number;
  /** Maximum delay in milliseconds */
  maxDelayMs: number;
}

// ============================================================================
// Status Callback Types
// ============================================================================

/**
 * Status update callback for tracking generation progress
 */
export type StatusUpdateCallback = (status: string) => void;

/**
 * Detailed status update with progress information
 */
export interface DetailedStatus {
  stage: 'initiating' | 'generating' | 'processing' | 'caching' | 'complete' | 'error';
  message: string;
  progress?: number;
  error?: string;
}

export type DetailedStatusCallback = (status: DetailedStatus) => void;
