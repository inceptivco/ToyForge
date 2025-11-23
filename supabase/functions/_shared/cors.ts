/**
 * CORS Headers Configuration
 *
 * Shared CORS configuration for all edge functions.
 */

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
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
