/**
 * Character Generation Pipeline Service
 *
 * Provides a high-level interface for character generation that handles
 * authentication checks and delegates to the SDK client.
 */

import type { CharacterConfig } from '../types';
import { supabase } from './supabase';
import {
  characterSmithClient,
  AuthenticationError,
  InsufficientCreditsError,
  CharacterSmithError,
} from './sdk/client';

// =============================================================================
// Error Types (re-exported for consumers)
// =============================================================================

export { AuthenticationError, InsufficientCreditsError, CharacterSmithError };

// =============================================================================
// Main Pipeline
// =============================================================================

/**
 * Generate a character image through the full pipeline.
 *
 * This function:
 * 1. Checks user authentication
 * 2. Delegates to the SDK client for generation
 * 3. Handles errors appropriately
 *
 * @param config - Character configuration
 * @param onStatusUpdate - Callback for status updates
 * @returns Promise<string> - URL of the generated image
 * @throws AuthenticationError - If user is not logged in
 * @throws InsufficientCreditsError - If user has insufficient credits
 * @throws CharacterSmithError - For other generation errors
 */
export async function generateCharacterPipeline(
  config: CharacterConfig,
  onStatusUpdate: (status: string) => void
): Promise<string> {
  onStatusUpdate('Checking authentication...');

  // Verify authentication before proceeding
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new AuthenticationError('You must be logged in to generate characters.');
  }

  onStatusUpdate('Initiating generation...');

  try {
    // Delegate to the SDK client
    const imageUrl = await characterSmithClient.generate(config, onStatusUpdate);

    onStatusUpdate('Generation complete!');
    return imageUrl;
  } catch (error) {
    console.error('[generateCharacterPipeline] Error:', error);

    // Re-throw known errors
    if (error instanceof CharacterSmithError) {
      throw error;
    }

    // Wrap unknown errors
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    throw new CharacterSmithError(message);
  }
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Clear the local image cache
 */
export async function clearGenerationCache(): Promise<void> {
  await characterSmithClient.clearCache();
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{ enabled: boolean }> {
  const stats = await characterSmithClient.getCacheStats();
  return { enabled: stats !== null };
}
