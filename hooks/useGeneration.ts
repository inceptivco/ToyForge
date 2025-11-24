/**
 * Character Generation Hook
 *
 * Manages the generation process including loading states,
 * error handling, and image persistence.
 */

import { useState, useCallback } from 'react';
import { CharacterConfig, GenerationStatus } from '../types';
import { generateCharacterPipeline } from '../services/geminiService';
import { useAuth } from '../contexts/AuthContext';
import { generationLogger } from '../utils/logger';
import {
  parseError,
  getUserFriendlyMessage,
  isAuthenticationError,
  isInsufficientCreditsError,
} from '../utils/errors';

// ============================================================================
// Types
// ============================================================================

interface GenerationState {
  status: GenerationStatus;
  message: string;
  imageUrl: string | null;
  error: string | null;
}

interface UseGenerationReturn {
  state: GenerationState;
  generate: (config: CharacterConfig) => Promise<string | null>;
  clearError: () => void;
  clearImage: () => void;
}

interface UseGenerationOptions {
  onAuthRequired?: () => void;
  onCreditsRequired?: () => void;
  persistImage?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY = 'lastGeneratedImage';

const INITIAL_STATE: GenerationState = {
  status: 'idle',
  message: '',
  imageUrl: null,
  error: null,
};

// ============================================================================
// Local Storage Helpers
// ============================================================================

function loadPersistedImage(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function persistImage(imageUrl: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, imageUrl);
  } catch (error) {
    generationLogger.warn('Failed to persist image to localStorage', { error });
  }
}

function clearPersistedImage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore
  }
}

// ============================================================================
// Hook
// ============================================================================

export function useGeneration(options: UseGenerationOptions = {}): UseGenerationReturn {
  const { onAuthRequired, onCreditsRequired, persistImage: shouldPersist = true } = options;
  const { isAuthenticated, refreshProfile } = useAuth();

  // Initialize with persisted image if available
  const [state, setState] = useState<GenerationState>(() => ({
    ...INITIAL_STATE,
    imageUrl: shouldPersist ? loadPersistedImage() : null,
  }));

  // Update status helper
  const updateStatus = useCallback((status: GenerationStatus, message: string = '') => {
    setState(prev => ({ ...prev, status, message, error: null }));
  }, []);

  // Handle status updates from the generation pipeline
  const handleStatusUpdate = useCallback((message: string) => {
    generationLogger.debug('Generation status', { message });

    // Map status messages to our status enum
    let status: GenerationStatus = 'generating';
    if (message.includes('Initiating')) status = 'initiating';
    if (message.includes('Caching')) status = 'caching';
    if (message.includes('Complete')) status = 'complete';
    if (message.includes('Retrieved')) status = 'complete';

    updateStatus(status, message);
  }, [updateStatus]);

  // Main generation function
  const generate = useCallback(async (config: CharacterConfig): Promise<string | null> => {
    generationLogger.info('Starting generation', {
      gender: config.gender,
      cache: config.cache,
    });

    updateStatus('initiating', 'Initiating Generation...');

    try {
      // Ensure caching is disabled for fresh generations
      const configWithNoCache = { ...config, cache: false };

      const imageUrl = await generateCharacterPipeline(
        configWithNoCache,
        handleStatusUpdate
      );

      if (imageUrl) {
        setState(prev => ({
          ...prev,
          status: 'complete',
          message: 'Generation Complete!',
          imageUrl,
          error: null,
        }));

        // Persist image
        if (shouldPersist) {
          persistImage(imageUrl);
        }

        // Refresh profile to get updated credit balance
        if (isAuthenticated) {
          await refreshProfile();
        }

        generationLogger.info('Generation successful', { imageUrl: imageUrl.substring(0, 50) });
        return imageUrl;
      }

      throw new Error('No image URL returned');

    } catch (error) {
      const appError = parseError(error);
      const friendlyMessage = getUserFriendlyMessage(appError);

      generationLogger.error('Generation failed', error, {
        code: appError.code,
        statusCode: appError.statusCode,
      });

      setState(prev => ({
        ...prev,
        status: 'error',
        message: '',
        error: friendlyMessage,
      }));

      // Trigger appropriate callback
      if (isAuthenticationError(appError)) {
        onAuthRequired?.();
      } else if (isInsufficientCreditsError(appError)) {
        onCreditsRequired?.();
      }

      return null;
    }
  }, [
    handleStatusUpdate,
    updateStatus,
    isAuthenticated,
    refreshProfile,
    shouldPersist,
    onAuthRequired,
    onCreditsRequired,
  ]);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null, status: 'idle', message: '' }));
  }, []);

  // Clear image
  const clearImage = useCallback(() => {
    setState(prev => ({ ...prev, imageUrl: null }));
    if (shouldPersist) {
      clearPersistedImage();
    }
  }, [shouldPersist]);

  return {
    state,
    generate,
    clearError,
    clearImage,
  };
}

export default useGeneration;
