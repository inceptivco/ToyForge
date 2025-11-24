/**
 * CORS Headers Configuration
 *
 * Shared CORS configuration for all edge functions.
 * SECURITY: Only allow requests from known origins.
 */

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  'https://characterforge.app',
  'https://www.characterforge.app',
  'https://app.characterforge.app',
  'http://localhost:3000',  // Development only
  'http://localhost:5173',  // Vite dev server
] as const;

/**
 * Get the appropriate CORS origin header based on the request origin.
 * Returns the origin if allowed, or the first allowed origin as fallback.
 */
export function getAllowedOrigin(requestOrigin: string | null): string {
  if (requestOrigin && ALLOWED_ORIGINS.includes(requestOrigin as typeof ALLOWED_ORIGINS[number])) {
    return requestOrigin;
  }
  // In production, you might want to return '' to block the request
  // For now, return the primary origin for non-browser requests (like API calls)
  return ALLOWED_ORIGINS[0];
}

/**
 * Create CORS headers for a specific request
 */
export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin');
  return {
    'Access-Control-Allow-Origin': getAllowedOrigin(origin),
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, DELETE, PUT',
    'Access-Control-Allow-Credentials': 'true',
  };
}

// Legacy static headers - prefer using getCorsHeaders(req) for proper origin handling
export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGINS[0],
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, DELETE, PUT',
} as const;

/**
 * Create a CORS preflight response
 */
export function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }
  return null;
}

/**
 * Create a JSON response with CORS headers
 */
export function jsonResponse<T>(
  data: T,
  status: number = 200,
  headers: Record<string, string> = {}
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'application/json',
      ...headers,
    },
  });
}

/**
 * Create an error response with CORS headers
 */
export function errorResponse(
  message: string,
  status: number = 500,
  code?: string
): Response {
  return jsonResponse(
    {
      error: message,
      ...(code && { code }),
    },
    status
  );
}
