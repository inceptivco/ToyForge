/**
 * Shared Utilities for Edge Functions
 *
 * Central export point for all shared edge function utilities.
 */

// Export CORS utilities
export {
  CORS_HEADERS,
  handleCors,
  jsonResponse,
  errorResponse,
} from './cors.ts';

// Export validation utilities
export {
  validateCharacterConfig,
  type ValidationResult,
  type CharacterConfigInput,
} from './validation.ts';

// Export auth utilities (prioritize auth.ts versions)
export {
  type AuthResult,
  type AuthError,
  sha256Hash,
  extractApiKey,
  extractBearerToken,
  authenticateWithApiKey,
  authenticateWithToken,
  authenticateRequest,
  isAuthError,
} from './auth.ts';

// Export general utilities
export {
  HTTP_STATUS,
  type FunctionContext,
  type ApiResponse,
  FunctionError,
  AuthenticationError,
  ValidationError,
  InsufficientCreditsError,
  RateLimitError,
  successResponse,
  createServiceClient,
  validateRequired,
  parseBody,
  checkRateLimit,
  createLogger,
  withErrorHandling,
} from './utils.ts';
