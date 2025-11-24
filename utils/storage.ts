/**
 * Storage URL Helper
 * 
 * Builds public storage URLs from environment variables to avoid hardcoding
 */

/**
 * Get the base Supabase URL from environment
 */
function getSupabaseUrl(): string {
  return import.meta.env.VITE_SUPABASE_URL || '';
}

/**
 * Build a public storage URL for a given path
 */
export function getStorageUrl(path: string): string {
  const baseUrl = getSupabaseUrl();
  if (!baseUrl) {
    // Fallback for development/demo - this should not happen in production
    return `/storage/v1/object/public/generations/${path}`;
  }
  return `${baseUrl}/storage/v1/object/public/generations/${path}`;
}

/**
 * Get default character image URL
 */
export function getDefaultCharacterUrl(): string {
  return getStorageUrl('default-character.png');
}

