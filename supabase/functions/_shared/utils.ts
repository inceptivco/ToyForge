/**
 * Shared Utilities for Edge Functions
 *
 * Common utilities, error handling, and response builders for Supabase Edge Functions.
 * This module promotes DRY principles and consistent behavior across all functions.
 */

import { createClient, SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { CORS_HEADERS, handleCors, jsonResponse, errorResponse } from './cors.ts';

// Re-export CORS utilities for convenience
export { CORS_HEADERS, handleCors, jsonResponse, errorResponse };

// =============================================================================
// Types
// =============================================================================

export interface FunctionContext {
  supabase: SupabaseClient;
  userId?: string;
}

export interface ApiResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}

export interface AuthResult {
  userId: string;
  email?: string;
}

// =============================================================================
// Constants
// =============================================================================

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  PAYMENT_REQUIRED: 402,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// =============================================================================
// Error Classes
// =============================================================================

export class FunctionError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = HTTP_STATUS.INTERNAL_ERROR,
    public readonly code?: string
  ) {
    super(message);
    this.name = 'FunctionError';
  }
}

export class AuthenticationError extends FunctionError {
  constructor(message: string = 'Authentication required') {
    super(message, HTTP_STATUS.UNAUTHORIZED, 'AUTH_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class ValidationError extends FunctionError {
  constructor(message: string) {
    super(message, HTTP_STATUS.BAD_REQUEST, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class InsufficientCreditsError extends FunctionError {
  constructor(message: string = 'Insufficient credits') {
    super(message, HTTP_STATUS.PAYMENT_REQUIRED, 'INSUFFICIENT_CREDITS');
    this.name = 'InsufficientCreditsError';
  }
}

export class RateLimitError extends FunctionError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, HTTP_STATUS.TOO_MANY_REQUESTS, 'RATE_LIMIT');
    this.name = 'RateLimitError';
  }
}

// =============================================================================
// Response Builders
// =============================================================================

/**
 * Create a success response with proper headers
 * Alias for jsonResponse for backward compatibility
 */
export function successResponse<T>(data: T, status: number = HTTP_STATUS.OK): Response {
  return jsonResponse(data, status);
}

// =============================================================================
// Authentication
// =============================================================================

/**
 * Create a Supabase client with service role
 */
export function createServiceClient(): SupabaseClient {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new FunctionError('Missing Supabase configuration', HTTP_STATUS.INTERNAL_ERROR);
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * Authenticate a request using Bearer token
 */
export async function authenticateRequest(
  req: Request,
  supabase: SupabaseClient
): Promise<AuthResult> {
  const authHeader = req.headers.get('Authorization');

  if (!authHeader) {
    throw new AuthenticationError('Missing Authorization header');
  }

  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    throw new AuthenticationError('Invalid authentication token');
  }

  return {
    userId: user.id,
    email: user.email,
  };
}

// =============================================================================
// Validation
// =============================================================================

/**
 * Validate that required fields are present in an object
 */
export function validateRequired<T extends object>(
  obj: T,
  fields: (keyof T)[]
): void {
  for (const field of fields) {
    if (obj[field] === undefined || obj[field] === null) {
      throw new ValidationError(`Missing required field: ${String(field)}`);
    }
  }
}

/**
 * Safely parse JSON from request body
 */
export async function parseBody<T>(req: Request): Promise<T> {
  try {
    const body = await req.json();
    return body as T;
  } catch {
    throw new ValidationError('Invalid JSON in request body');
  }
}

// =============================================================================
// Rate Limiting (Simple In-Memory Implementation)
// =============================================================================

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Check rate limit for a given key
 * Note: This is a simple in-memory implementation.
 * For production, use Redis or a database-backed solution.
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): void {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    // New window
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return;
  }

  if (entry.count >= maxRequests) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    throw new RateLimitError(`Rate limit exceeded. Try again in ${retryAfter} seconds.`);
  }

  entry.count++;
}

// =============================================================================
// Logging
// =============================================================================

/**
 * Create a namespaced logger
 */
export function createLogger(namespace: string) {
  return {
    info: (msg: string, ...args: unknown[]) =>
      console.log(`[${namespace}] ${msg}`, ...args),
    warn: (msg: string, ...args: unknown[]) =>
      console.warn(`[${namespace}] ${msg}`, ...args),
    error: (msg: string, ...args: unknown[]) =>
      console.error(`[${namespace}] ${msg}`, ...args),
  };
}

// =============================================================================
// Handler Wrapper
// =============================================================================

type Handler = (req: Request, ctx: FunctionContext) => Promise<Response>;

/**
 * Wrap a handler with standard error handling and CORS
 */
export function withErrorHandling(handler: Handler): (req: Request) => Promise<Response> {
  return async (req: Request): Promise<Response> => {
    // Handle CORS
    const corsResponse = handleCors(req);
    if (corsResponse) return corsResponse;

    try {
      const supabase = createServiceClient();
      const ctx: FunctionContext = { supabase };

      return await handler(req, ctx);
    } catch (error) {
      if (error instanceof FunctionError) {
        return errorResponse(error.message, error.statusCode);
      }

      console.error('Unhandled error:', error);
      const message = error instanceof Error ? error.message : 'Internal server error';
      return errorResponse(message, HTTP_STATUS.INTERNAL_ERROR);
    }
  };
}

// Declare Deno global for TypeScript
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};
