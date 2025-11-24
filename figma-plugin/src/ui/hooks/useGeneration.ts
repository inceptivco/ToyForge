/**
 * ToyForge Figma Plugin - Generation Hook
 */

import { useState, useCallback } from 'react';
import type { CharacterConfig, GenerationState, HistoryItem } from '../types';
import { generateCharacter, fetchImageAsBytes } from '../services/supabase';
import { STORAGE_KEYS, MAX_HISTORY_ITEMS } from '../constants';

// Helper to get config name for canvas
function getCharacterName(config: CharacterConfig): string {
  const gender = config.gender === 'male' ? 'Boy' : 'Girl';
  const age = config.ageGroup || 'teen';
  const ageLabel = age.charAt(0).toUpperCase() + age.slice(1).replace('_', ' ');
  return `ToyForge ${ageLabel} ${gender}`;
}

// Post message to Figma
function postToFigma(message: unknown) {
  parent.postMessage({ pluginMessage: message }, '*');
}

export function useGeneration() {
  const [generationState, setGenerationState] = useState<GenerationState>({
    status: 'idle',
    message: '',
  });
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.HISTORY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [lastGeneratedImage, setLastGeneratedImage] = useState<string | null>(null);

  // Generate and place on canvas
  const generate = useCallback(async (config: CharacterConfig): Promise<{ success: boolean; error?: string }> => {
    setGenerationState({ status: 'initiating', message: 'Starting generation...' });

    try {
      // Call API
      setGenerationState({ status: 'generating', message: 'Generating character...' });
      const result = await generateCharacter(config);

      if (result.error) {
        setGenerationState({ status: 'error', message: result.error });
        return { success: false, error: result.error };
      }

      if (!result.image) {
        setGenerationState({ status: 'error', message: 'No image returned' });
        return { success: false, error: 'No image returned' };
      }

      // Fetch image bytes
      setGenerationState({ status: 'processing', message: 'Processing image...' });
      const imageBytes = await fetchImageAsBytes(result.image);

      // Place on canvas
      setGenerationState({ status: 'placing', message: 'Placing on canvas...' });
      const name = getCharacterName(config);

      postToFigma({
        type: 'place-image',
        imageData: imageBytes,
        name,
        width: 512,
        height: 512,
      });

      // Update last generated
      setLastGeneratedImage(result.image);

      // Add to history
      const historyItem: HistoryItem = {
        id: Date.now().toString(),
        config,
        imageUrl: result.image,
        timestamp: Date.now(),
      };

      setHistory(prev => {
        const newHistory = [historyItem, ...prev].slice(0, MAX_HISTORY_ITEMS);
        try {
          localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(newHistory));
        } catch {
          // Ignore storage errors
        }
        return newHistory;
      });

      setGenerationState({ status: 'complete', message: 'Character placed!' });
      return { success: true };

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Generation failed';
      setGenerationState({ status: 'error', message });
      return { success: false, error: message };
    }
  }, []);

  // Re-insert from history
  const reinsertFromHistory = useCallback(async (item: HistoryItem) => {
    setGenerationState({ status: 'processing', message: 'Re-inserting...' });

    try {
      const imageBytes = await fetchImageAsBytes(item.imageUrl);
      const name = getCharacterName(item.config);

      postToFigma({
        type: 'place-image',
        imageData: imageBytes,
        name,
        width: 512,
        height: 512,
      });

      setGenerationState({ status: 'complete', message: 'Character placed!' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to re-insert';
      setGenerationState({ status: 'error', message });
    }
  }, []);

  // Clear history
  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEYS.HISTORY);
    } catch {
      // Ignore
    }
  }, []);

  // Reset state
  const resetState = useCallback(() => {
    setGenerationState({ status: 'idle', message: '' });
  }, []);

  return {
    generationState,
    history,
    lastGeneratedImage,
    generate,
    reinsertFromHistory,
    clearHistory,
    resetState,
  };
}
