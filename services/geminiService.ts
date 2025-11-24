/**
 * Character Generation Pipeline Service
 *
 * Provides a high-level interface for character generation that handles
 * authentication checks and delegates to the SDK client.
 */

import type { CharacterConfig } from '../types';
import { supabase } from './supabase';
import {
  characterForgeClient,
  AuthenticationError,
  InsufficientCreditsError,
  CharacterForgeError,
} from './sdk/client';

// =============================================================================
// Error Types (re-exported for consumers)
// =============================================================================

export { AuthenticationError, InsufficientCreditsError, CharacterForgeError };

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
 * @throws CharacterForgeError - For other generation errors
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
    const imageUrl = await characterForgeClient.generate(config, onStatusUpdate);

    onStatusUpdate('Generation complete!');
    return imageUrl;
  } catch (error) {
    console.error('[generateCharacterPipeline] Error:', error);

    // Re-throw known errors
    if (error instanceof CharacterForgeError) {
      throw error;
    }

    // Wrap unknown errors
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    throw new CharacterForgeError(message);
  }
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Clear the local image cache
 */
export async function clearGenerationCache(): Promise<void> {
  await characterForgeClient.clearCache();
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{ enabled: boolean }> {
  const stats = await characterForgeClient.getCacheStats();
  return { enabled: stats !== null };
}
