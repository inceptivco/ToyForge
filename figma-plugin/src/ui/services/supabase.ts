/**
 * CharacterForge Figma Plugin - Supabase Service
 */

import { createClient, SupabaseClient, Session } from '@supabase/supabase-js';
import type { UserProfile, CharacterConfig } from '../types';
import { STORAGE_KEYS } from '../constants';
import { figmaStorageAdapter } from '../utils/storage';

// Supabase configuration
// SECURITY NOTE: The anon key is safe to expose in client-side code (like this Figma plugin).
// Supabase security relies on Row Level Security (RLS) policies, not on hiding the anon key.
// All sensitive operations are protected by RLS policies that ensure users can only access
// their own data. The anon key is designed to be public - it's the RLS policies that protect your data.
const SUPABASE_URL = 'https://mnxzykltetirdcnxugcl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ueHp5a2x0ZXRpcmRjbnh1Z2NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1OTMxMTQsImV4cCI6MjA3OTE2OTExNH0.OSQGq3p5iGX2Eoon-Jo1hnie5IMhxkVKTQ5CBaaXeUQ';

// The main CharacterForge app URL for auth callbacks
// This page will handle the magic link and store tokens for the plugin to retrieve
// Use localhost for development, production URL for production builds
const AUTH_CALLBACK_BASE = import.meta.env.DEV 
  ? 'http://localhost:3000'
  : 'https://characterforge.app';

// Create Supabase client with persistent session storage using Figma's clientStorage API
export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Disable for Figma plugin
    storage: {
      getItem: async (key: string) => {
        try {
          const value = await figmaStorageAdapter.getItem(key);
          // Log session restoration for debugging
          if (key.includes('auth-token')) {
            console.log('Restoring session from Figma storage:', key, value ? 'Found' : 'Not found');
          }
          return value;
        } catch (error) {
          console.error('Error reading from Figma storage:', error);
          return null;
        }
      },
      setItem: async (key: string, value: string) => {
        try {
          await figmaStorageAdapter.setItem(key, value);
          // Log session save for debugging
          if (key.includes('auth-token')) {
            console.log('Saving session to Figma storage:', key);
          }
        } catch (error) {
          console.error('Error writing to Figma storage:', error);
          // Ignore storage errors in plugin context
        }
      },
      removeItem: async (key: string) => {
        try {
          await figmaStorageAdapter.removeItem(key);
          if (key.includes('auth-token')) {
            console.log('Removed session from Figma storage:', key);
          }
        } catch (error) {
          console.error('Error removing from Figma storage:', error);
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
    await figmaStorageAdapter.setItem(STORAGE_KEYS.AUTH_SESSION + '_pending', JSON.stringify({
      authCode,
      email,
      timestamp: Date.now(),
    }));
  } catch {
    // Continue even if storage fails
  }

  const redirectUrl = `${AUTH_CALLBACK_BASE}/figma-auth?code=${authCode}`;
  console.log('Sending magic link with redirect URL:', redirectUrl);
  console.log('Auth code:', authCode);
  console.log('AUTH_CALLBACK_BASE:', AUTH_CALLBACK_BASE);

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      // Redirect to the main app which will handle the auth callback
      // The callback page will display the auth code for the user to verify
      emailRedirectTo: redirectUrl,
    },
  });

  if (error) {
    try {
      await figmaStorageAdapter.removeItem(STORAGE_KEYS.AUTH_SESSION + '_pending');
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
      await figmaStorageAdapter.removeItem(STORAGE_KEYS.AUTH_SESSION + '_pending');
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
 * Get pending auth info from storage
 */
export async function getPendingAuth(): Promise<{ authCode: string; email: string; timestamp: number } | null> {
  try {
    const pending = await figmaStorageAdapter.getItem(STORAGE_KEYS.AUTH_SESSION + '_pending');
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
export async function clearPendingAuth(): Promise<void> {
  try {
    await figmaStorageAdapter.removeItem(STORAGE_KEYS.AUTH_SESSION + '_pending');
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
    await clearPendingAuth();

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
    await figmaStorageAdapter.removeItem(STORAGE_KEYS.AUTH_SESSION);
    await figmaStorageAdapter.removeItem(STORAGE_KEYS.AUTH_SESSION + '_pending');
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

  console.log('[createCheckout] Creating checkout with options:', options);
  console.log('[createCheckout] Session exists:', !!session, 'User ID:', session.user.id);

  try {
    // Use manual fetch to ensure Authorization header is set correctly
    const functionUrl = `${SUPABASE_URL}/functions/v1/create-checkout`;
    console.log('[createCheckout] Calling function URL:', functionUrl);

    // For Figma plugin, redirect to the main app after successful payment
    // The webhook will update credits, and user can return to plugin
    const successUrl = `${AUTH_CALLBACK_BASE}/app?success=true&source=figma`;
    const cancelUrl = `${AUTH_CALLBACK_BASE}/app?canceled=true&source=figma`;

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        ...options,
        successUrl,
        cancelUrl,
      }),
    });

    console.log('[createCheckout] Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[createCheckout] Error response:', errorText);
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText || `HTTP ${response.status}` };
      }
      return { error: errorData.message || `HTTP ${response.status}: ${response.statusText}` };
    }

    const data = await response.json();
    console.log('[createCheckout] Response data:', data);

    if (!data?.url) {
      console.error('[createCheckout] No URL in response:', data);
      return { error: 'No checkout URL returned' };
    }

    console.log('[createCheckout] Checkout URL received:', data.url);
    return { url: data.url };
  } catch (err) {
    console.error('[createCheckout] Exception:', err);
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
