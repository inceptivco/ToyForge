/**
 * Character Configuration Hook
 *
 * Manages the character configuration state with gender-aware
 * asset filtering and randomization.
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  CharacterConfig,
  Gender,
  HairStyleId,
  ClothingItemId,
  AccessoryId,
} from '../types';
import {
  DEFAULT_CONFIG,
  SKIN_TONES,
  HAIR_STYLES,
  HAIR_COLORS,
  CLOTHING_ITEMS,
  CLOTHING_COLORS,
  ACCESSORIES,
  EYE_COLORS,
  AGE_GROUPS,
} from '../constants';
import { logger } from '../utils/logger';

// ============================================================================
// Types
// ============================================================================

interface UseCharacterConfigOptions {
  /**
   * Initial configuration to use.
   * If not provided, uses DEFAULT_CONFIG.
   */
  initialConfig?: CharacterConfig;
  /**
   * Whether to randomize the config on initial mount.
   * Only applies when no initialConfig is provided.
   * @default false
   */
  randomizeOnMount?: boolean;
}

interface UseCharacterConfigReturn {
  config: CharacterConfig;
  setConfig: (config: CharacterConfig) => void;
  updateField: <K extends keyof CharacterConfig>(key: K, value: CharacterConfig[K]) => void;
  setGender: (gender: Gender) => void;
  randomize: () => void;
  reset: () => void;
  availableHairStyles: typeof HAIR_STYLES;
  availableClothing: typeof CLOTHING_ITEMS;
}

// ============================================================================
// Accessory Conflict Groups
// ============================================================================

const ACCESSORY_CONFLICTS: Record<AccessoryId, AccessoryId[]> = {
  none: [],
  glasses: ['sunglasses'],
  sunglasses: ['glasses'],
  cap: ['beanie'],
  beanie: ['cap'],
  headphones: [],
};

// ============================================================================
// Utility Functions
// ============================================================================

function getRandomElement<T>(array: readonly T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function filterByGender<T extends { gender?: Gender }>(
  items: readonly T[],
  gender: Gender
): T[] {
  return items.filter(item => !item.gender || item.gender === gender);
}

function resolveAccessoryConflicts(accessories: AccessoryId[]): AccessoryId[] {
  const result: AccessoryId[] = [];
  const conflicts = new Set<AccessoryId>();

  for (const accessory of accessories) {
    if (conflicts.has(accessory)) continue;

    result.push(accessory);

    // Add conflicts for this accessory
    ACCESSORY_CONFLICTS[accessory]?.forEach(conflict => conflicts.add(conflict));
  }

  return result;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for managing character configuration state.
 *
 * @param options - Configuration options
 * @param options.initialConfig - Initial configuration (defaults to DEFAULT_CONFIG)
 * @param options.randomizeOnMount - Whether to randomize on mount (defaults to false)
 *
 * @example
 * // Use with default config (no randomization)
 * const { config, randomize } = useCharacterConfig();
 *
 * @example
 * // Randomize on mount (useful for demo/showcase)
 * const { config } = useCharacterConfig({ randomizeOnMount: true });
 *
 * @example
 * // Use with saved/restored config
 * const { config } = useCharacterConfig({ initialConfig: savedConfig });
 */
export function useCharacterConfig(
  options: UseCharacterConfigOptions = {}
): UseCharacterConfigReturn {
  const { initialConfig = DEFAULT_CONFIG, randomizeOnMount = false } = options;
  const [config, setConfigInternal] = useState<CharacterConfig>(initialConfig);

  // Filter assets based on current gender
  const availableHairStyles = useMemo(
    () => filterByGender(HAIR_STYLES, config.gender),
    [config.gender]
  );

  const availableClothing = useMemo(
    () => filterByGender(CLOTHING_ITEMS, config.gender),
    [config.gender]
  );

  // Set config with logging
  const setConfig = useCallback((newConfig: CharacterConfig) => {
    logger.debug('Setting character config', { gender: newConfig.gender });
    setConfigInternal(newConfig);
  }, []);

  // Update a single field
  const updateField = useCallback(<K extends keyof CharacterConfig>(
    key: K,
    value: CharacterConfig[K]
  ) => {
    setConfigInternal(prev => ({ ...prev, [key]: value }));
  }, []);

  // Handle gender change with asset validation
  const setGender = useCallback((newGender: Gender) => {
    setConfigInternal(prev => {
      const validHairStyles = filterByGender(HAIR_STYLES, newGender);
      const validClothing = filterByGender(CLOTHING_ITEMS, newGender);

      // Check if current selections are still valid
      const currentHairValid = validHairStyles.some(h => h.id === prev.hairStyle);
      const currentClothingValid = validClothing.some(c => c.id === prev.clothing);

      return {
        ...prev,
        gender: newGender,
        hairStyle: currentHairValid
          ? prev.hairStyle
          : (validHairStyles[0]?.id as HairStyleId) || 'messy',
        clothing: currentClothingValid
          ? prev.clothing
          : (validClothing[0]?.id as ClothingItemId) || 'tshirt',
      };
    });

    logger.debug('Gender changed', { gender: newGender });
  }, []);

  // Generate random configuration
  const randomize = useCallback(() => {
    const gender = Math.random() > 0.5 ? 'male' : 'female';
    const validHairStyles = filterByGender(HAIR_STYLES, gender);
    const validClothing = filterByGender(CLOTHING_ITEMS, gender);

    // Random accessories (0-3)
    const numAccessories = Math.floor(Math.random() * 4);
    const shuffledAccessories = [...ACCESSORIES]
      .filter(a => a.id !== 'none')
      .sort(() => 0.5 - Math.random())
      .slice(0, numAccessories)
      .map(a => a.id as AccessoryId);

    const accessories = shuffledAccessories.length > 0
      ? resolveAccessoryConflicts(shuffledAccessories)
      : ['none' as AccessoryId];

    const newConfig: CharacterConfig = {
      gender,
      ageGroup: getRandomElement(AGE_GROUPS).id,
      skinTone: getRandomElement(SKIN_TONES).id as CharacterConfig['skinTone'],
      hairStyle: getRandomElement(validHairStyles).id as HairStyleId,
      hairColor: getRandomElement(HAIR_COLORS).id as CharacterConfig['hairColor'],
      clothing: getRandomElement(validClothing).id as ClothingItemId,
      clothingColor: getRandomElement(CLOTHING_COLORS).id as CharacterConfig['clothingColor'],
      eyeColor: getRandomElement(EYE_COLORS).id as CharacterConfig['eyeColor'],
      accessories,
      transparent: config.transparent, // Keep current transparency setting
      cache: config.cache,
    };

    setConfigInternal(newConfig);
    logger.debug('Config randomized', { gender });
  }, [config.transparent, config.cache]);

  // Reset to default
  const reset = useCallback(() => {
    setConfigInternal(DEFAULT_CONFIG);
    logger.debug('Config reset to default');
  }, []);

  // Optionally randomize on initial mount
  useEffect(() => {
    if (randomizeOnMount) {
      randomize();
    }
    // Only run on mount, randomize is stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [randomizeOnMount]);

  return {
    config,
    setConfig,
    updateField,
    setGender,
    randomize,
    reset,
    availableHairStyles,
    availableClothing,
  };
}

export default useCharacterConfig;
