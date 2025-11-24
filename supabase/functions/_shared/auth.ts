/**
 * Authentication Utilities for Edge Functions
 *
 * Shared authentication logic for validating users and API keys.
 */

import { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.200.0/crypto/mod.ts";

// ============================================================================
// Types
// ============================================================================

export interface AuthResult {
  userId: string;
  apiKeyId: string | null;
  isApiRequest: boolean;
}

export interface AuthError {
  message: string;
  code: 'NO_AUTH' | 'INVALID_TOKEN' | 'INVALID_API_KEY' | 'REVOKED_API_KEY';
  statusCode: number;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Hash a string using SHA-256
 */
export async function sha256Hash(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ============================================================================
// API Key Extraction
// ============================================================================

/**
 * Extract API key from request headers
 */
export function extractApiKey(req: Request): string | null {
  // Check x-api-key header first (preferred)
  const apiKeyHeader = req.headers.get('x-api-key');
  if (apiKeyHeader) {
    return apiKeyHeader.replace(/^Bearer\s+/i, '').trim();
  }

  // Check Authorization header for API keys (legacy support)
  const authHeader = req.headers.get('Authorization');
  if (authHeader) {
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    // API keys start with 'sk_'
    if (token.startsWith('sk_')) {
      console.warn('[auth] API key in Authorization header. Use x-api-key instead.');
      return token;
    }
  }

  return null;
}

/**
 * Extract bearer token from request
 */
export function extractBearerToken(req: Request): string | null {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return null;

  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  // Don't return API keys as bearer tokens
  if (token.startsWith('sk_')) return null;

  return token || null;
}

// ============================================================================
// Authentication Methods
// ============================================================================

/**
 * Authenticate using an API key
 */
export async function authenticateWithApiKey(
  apiKey: string,
  supabase: SupabaseClient
): Promise<AuthResult | AuthError> {
  console.log('[auth] Authenticating with API key:', apiKey.substring(0, 10) + '...');

  const keyHash = await sha256Hash(apiKey);

  const { data: apiKeyData, error } = await supabase
    .from('api_keys')
    .select('id, user_id, deleted_at')
    .eq('key_hash', keyHash)
    .single();

  if (error || !apiKeyData) {
    return {
      message: 'Invalid or inactive API key',
      code: 'INVALID_API_KEY',
      statusCode: 401,
    };
  }

  if (apiKeyData.deleted_at) {
    return {
      message: 'This API key has been revoked. Please create a new key.',
      code: 'REVOKED_API_KEY',
      statusCode: 401,
    };
  }

  // Update last_used_at (fire and forget)
  supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', apiKeyData.id)
    .then(() => {});

  return {
    userId: apiKeyData.user_id,
    apiKeyId: apiKeyData.id,
    isApiRequest: true,
  };
}

/**
 * Authenticate using a bearer token
 */
export async function authenticateWithToken(
  token: string,
  supabase: SupabaseClient
): Promise<AuthResult | AuthError> {
  console.log('[auth] Authenticating with Bearer token');

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return {
      message: 'Invalid authentication token',
      code: 'INVALID_TOKEN',
      statusCode: 401,
    };
  }

  return {
    userId: user.id,
    apiKeyId: null,
    isApiRequest: false,
  };
}

/**
 * Main authentication function that tries both methods
 */
export async function authenticateRequest(
  req: Request,
  supabase: SupabaseClient
): Promise<AuthResult | AuthError> {
  // Try API key first
  const apiKey = extractApiKey(req);
  if (apiKey) {
    return authenticateWithApiKey(apiKey, supabase);
  }

  // Try bearer token
  const token = extractBearerToken(req);
  if (token) {
    return authenticateWithToken(token, supabase);
  }

  return {
    message: 'No authentication provided. Please provide either an API key (x-api-key header) or Bearer token (Authorization header)',
    code: 'NO_AUTH',
    statusCode: 401,
  };
}

/**
 * Type guard to check if result is an error
 */
export function isAuthError(result: AuthResult | AuthError): result is AuthError {
  return 'code' in result && 'statusCode' in result;
}
