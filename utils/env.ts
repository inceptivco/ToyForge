/**
 * Environment Variable Validation and Access
 *
 * This module provides type-safe access to environment variables
 * with validation to catch missing configuration early.
 */

import { logger } from './logger';

// ============================================================================
// Types
// ============================================================================

interface EnvConfig {
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
}

interface OptionalEnvConfig {
  GEMINI_API_KEY?: string;
  VITE_GA_TRACKING_ID?: string;
}

type EnvKey = keyof EnvConfig;
type OptionalEnvKey = keyof OptionalEnvConfig;

// ============================================================================
// Environment Access
// ============================================================================

function getEnvValue(key: string): string | undefined {
  // Vite environment variables
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[key];
  }
  // Node.js environment variables (for edge functions)
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  return undefined;
}

// ============================================================================
// Validation
// ============================================================================

const requiredEnvVars: EnvKey[] = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
];

/**
 * Validate that all required environment variables are present
 */
export function validateEnv(): boolean {
  const missing: string[] = [];

  for (const key of requiredEnvVars) {
    const value = getEnvValue(key);
    if (!value) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    logger.error('Missing required environment variables', undefined, {
      missing,
    });
    return false;
  }

  return true;
}

/**
 * Get a required environment variable (throws if missing)
 */
export function getRequiredEnv(key: EnvKey): string {
  const value = getEnvValue(key);
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

/**
 * Get an optional environment variable
 */
export function getOptionalEnv(key: OptionalEnvKey): string | undefined {
  return getEnvValue(key);
}

// ============================================================================
// Typed Environment Object
// ============================================================================

/**
 * Lazily loaded environment configuration
 * This ensures validation happens at first access
 */
class Environment {
  private _validated = false;
  private _config: EnvConfig | null = null;

  private validate(): EnvConfig {
    if (this._config) {
      return this._config;
    }

    const supabaseUrl = getEnvValue('VITE_SUPABASE_URL');
    const supabaseAnonKey = getEnvValue('VITE_SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseAnonKey) {
      const missing = [];
      if (!supabaseUrl) missing.push('VITE_SUPABASE_URL');
      if (!supabaseAnonKey) missing.push('VITE_SUPABASE_ANON_KEY');

      throw new Error(
        `Missing required environment variables: ${missing.join(', ')}. ` +
        'Please check your .env.local file.'
      );
    }

    this._config = {
      VITE_SUPABASE_URL: supabaseUrl,
      VITE_SUPABASE_ANON_KEY: supabaseAnonKey,
    };

    this._validated = true;
    return this._config;
  }

  get supabaseUrl(): string {
    return this.validate().VITE_SUPABASE_URL;
  }

  get supabaseAnonKey(): string {
    return this.validate().VITE_SUPABASE_ANON_KEY;
  }

  get isDevelopment(): boolean {
    return import.meta.env?.DEV ?? false;
  }

  get isProduction(): boolean {
    return import.meta.env?.PROD ?? false;
  }

  get isValidated(): boolean {
    return this._validated;
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const env = new Environment();

// ============================================================================
// Initialization Helper
// ============================================================================

/**
 * Initialize and validate environment on app startup
 * Call this in your app entry point
 */
export function initializeEnv(): void {
  try {
    // Access a property to trigger validation
    void env.supabaseUrl;
    logger.info('Environment validated successfully');
  } catch (error) {
    logger.error('Environment validation failed', error);
    throw error;
  }
}
