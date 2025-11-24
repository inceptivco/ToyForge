/**
 * Redirect URL Utilities
 * 
 * Provides utilities for generating redirect URLs for authentication and other purposes.
 * Ensures production URLs point to characterforge.app
 */

/**
 * Get the base URL for redirects
 * In production, always returns https://characterforge.app
 * In development, returns the current window origin
 */
export function getRedirectBaseUrl(): string {
  // Check if we're in a browser environment
  if (typeof window !== 'undefined') {
    // Always use production domain if we're on characterforge.app
    if (window.location.hostname === 'characterforge.app') {
      return 'https://characterforge.app';
    }
    
    // In production build (deployed), always use production domain
    if (import.meta.env?.PROD) {
      return 'https://characterforge.app';
    }
    
    // In development (localhost), use current origin
    return window.location.origin;
  }
  
  // For server-side/edge functions, default to production
  return 'https://characterforge.app';
}

/**
 * Get the full redirect URL for magic links
 * Optionally includes a path, defaults to current path
 */
export function getMagicLinkRedirectUrl(path?: string): string {
  const baseUrl = getRedirectBaseUrl();
  
  if (path) {
    return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  }
  
  // If no path provided and we're in browser, use current path
  if (typeof window !== 'undefined') {
    return `${baseUrl}${window.location.pathname}${window.location.search}${window.location.hash}`;
  }
  
  return baseUrl;
}

