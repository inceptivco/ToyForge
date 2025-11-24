/**
 * ToyForge Figma Plugin - Supabase Service
 */

import { createClient, SupabaseClient, Session } from '@supabase/supabase-js';
import type { UserProfile, CharacterConfig } from '../types';
import { STORAGE_KEYS } from '../constants';

// Supabase configuration
const SUPABASE_URL = 'https://qfbjiclgpqwrljeddnyy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmYmppY2xncHF3cmxqZWRkbnl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwMjcyNDksImV4cCI6MjA2MzYwMzI0OX0.bnKmxR44znJ1qaMkPSkNpHqHsAt4Z0RVo2kH5tpGdXI';

// The main ToyForge app URL for auth callbacks
// This page will handle the magic link and store tokens for the plugin to retrieve
const AUTH_CALLBACK_BASE = 'https://toyforge.app';

// Create Supabase client
export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Disable for Figma plugin
    storage: {
      getItem: (key: string) => {
        try {
          return localStorage.getItem(key);
        } catch {
          return null;
        }
      },
      setItem: (key: string, value: string) => {
        try {
          localStorage.setItem(key, value);
        } catch {
          // Ignore storage errors in plugin context
        }
      },
      removeItem: (key: string) => {
        try {
          localStorage.removeItem(key);
        } catch {
          // Ignore storage errors in plugin context
        }
      },
    },
  },
});

/**
 * Generate a unique auth code for linking sessions
 */
function generateAuthCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Get current session
 */
export async function getSession(): Promise<Session | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

/**
 * Get current user profile
 */
export async function getUserProfile(): Promise<UserProfile | null> {
  const session = await getSession();
  if (!session?.user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (error) {
    console.error('Failed to fetch profile:', error);
    return null;
  }

  return {
    ...data,
    email: session.user.email || '',
  };
}

/**
 * Initiate magic link sign-in
 * Generates an auth code and stores pending auth info
 */
export async function initiateMagicLink(email: string): Promise<{ authCode?: string; error?: string }> {
  // Generate a unique auth code for this sign-in attempt
  const authCode = generateAuthCode();

  // Store pending auth info locally
  try {
    localStorage.setItem(STORAGE_KEYS.AUTH_SESSION + '_pending', JSON.stringify({
      authCode,
      email,
      timestamp: Date.now(),
    }));
  } catch {
    // Continue even if storage fails
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      // Redirect to the main app which will handle the auth callback
      // The callback page will display the auth code for the user to verify
      emailRedirectTo: `${AUTH_CALLBACK_BASE}/figma-auth?code=${authCode}`,
    },
  });

  if (error) {
    try {
      localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION + '_pending');
    } catch {
      // Ignore
    }
    return { error: error.message };
  }

  return { authCode };
}

/**
 * Poll for auth completion using secure database function
 * Uses get_figma_auth_tokens() to prevent bulk token exfiltration
 */
export async function pollForAuthCompletion(authCode: string): Promise<{
  success: boolean;
  pending?: boolean;
  error?: string
}> {
  try {
    // Use the secure function instead of direct table access
    // This prevents bulk token exfiltration - only returns data for exact code match
    const { data, error } = await supabase
      .rpc('get_figma_auth_tokens', { p_code: authCode });

    if (error) {
      console.error('Poll error:', error);
      // Function might not exist yet, return pending
      return { success: false, pending: true };
    }

    // data is an array from the function
    if (!data || data.length === 0 || !data[0]?.access_token) {
      // Auth not yet completed
      return { success: false, pending: true };
    }

    const tokens = data[0];

    // Found auth data - establish session
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
    });

    if (sessionError) {
      return { success: false, error: sessionError.message };
    }

    // Mark the code as used via secure function
    await supabase.rpc('mark_figma_auth_code_used', { p_code: authCode });

    // Clean up pending auth
    try {
      localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION + '_pending');
    } catch {
      // Ignore
    }

    return { success: true };
  } catch (err) {
    console.error('Poll exception:', err);
    return { success: false, pending: true };
  }
}

/**
 * Get pending auth info from localStorage
 */
export function getPendingAuth(): { authCode: string; email: string; timestamp: number } | null {
  try {
    const pending = localStorage.getItem(STORAGE_KEYS.AUTH_SESSION + '_pending');
    if (pending) {
      return JSON.parse(pending);
    }
  } catch {
    // Ignore
  }
  return null;
}

/**
 * Clear pending auth
 */
export function clearPendingAuth(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION + '_pending');
  } catch {
    // Ignore
  }
}

/**
 * Manual session establishment using tokens (fallback)
 */
export async function setSessionFromTokens(
  accessToken: string,
  refreshToken: string
): Promise<{ error?: string }> {
  try {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (error) {
      return { error: error.message };
    }

    // Clear any pending auth
    clearPendingAuth();

    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to set session' };
  }
}

/**
 * Sign out
 */
export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
  try {
    localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
    localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION + '_pending');
  } catch {
    // Ignore
  }
}

/**
 * Generate character via edge function
 */
export async function generateCharacter(config: CharacterConfig): Promise<{ image?: string; error?: string }> {
  const session = await getSession();
  if (!session) {
    return { error: 'Please sign in to generate characters' };
  }

  try {
    const { data, error } = await supabase.functions.invoke('generate-character', {
      body: config,
    });

    if (error) {
      console.error('Generation error:', error);
      return { error: error.message || 'Generation failed' };
    }

    if (!data?.image) {
      return { error: 'No image returned' };
    }

    return { image: data.image };
  } catch (err) {
    console.error('Generation error:', err);
    return { error: err instanceof Error ? err.message : 'Generation failed' };
  }
}

/**
 * Create checkout session for credits
 */
export async function createCheckout(
  options: { packId?: string; amount?: number; type: 'app' | 'api' }
): Promise<{ url?: string; error?: string }> {
  const session = await getSession();
  if (!session) {
    return { error: 'Please sign in first' };
  }

  try {
    const { data, error } = await supabase.functions.invoke('create-checkout', {
      body: options,
    });

    if (error) {
      return { error: error.message || 'Failed to create checkout' };
    }

    if (!data?.url) {
      return { error: 'No checkout URL returned' };
    }

    return { url: data.url };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Checkout failed' };
  }
}

/**
 * Fetch image as bytes for Figma canvas
 */
export async function fetchImageAsBytes(url: string): Promise<Uint8Array> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

/**
 * Subscribe to auth state changes
 */
export function onAuthStateChange(callback: (session: Session | null) => void) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
}
