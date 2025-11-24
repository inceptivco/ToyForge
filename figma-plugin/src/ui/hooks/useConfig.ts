/**
 * ToyForge Figma Plugin - Config Hook
 */

import { useState, useCallback, useMemo } from 'react';
import type { CharacterConfig, Gender } from '../types';
import { DEFAULT_CONFIG, HAIR_STYLES, CLOTHING_ITEMS, STORAGE_KEYS, SKIN_TONES, HAIR_COLORS, CLOTHING_COLORS, EYE_COLORS, ACCESSORIES } from '../constants';

export function useConfig() {
  const [config, setConfig] = useState<CharacterConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CONFIG);
      return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
    } catch {
      return DEFAULT_CONFIG;
    }
  });

  // Filter assets based on gender
  const availableHairStyles = useMemo(
    () => HAIR_STYLES.filter(h => !h.gender || h.gender === config.gender),
    [config.gender]
  );

  const availableClothing = useMemo(
    () => CLOTHING_ITEMS.filter(c => !c.gender || c.gender === config.gender),
    [config.gender]
  );

  // Update config
  const updateConfig = useCallback((updates: Partial<CharacterConfig>) => {
    setConfig(prev => {
      const newConfig = { ...prev, ...updates };
      try {
        localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(newConfig));
      } catch {
        // Ignore storage errors
      }
      return newConfig;
    });
  }, []);

  // Handle gender change with validation
  const handleGenderChange = useCallback((newGender: Gender) => {
    const validHair = HAIR_STYLES.filter(h => !h.gender || h.gender === newGender);
    const validClothes = CLOTHING_ITEMS.filter(c => !c.gender || c.gender === newGender);

    setConfig(prev => {
      const newHair = validHair.find(h => h.id === prev.hairStyle)
        ? prev.hairStyle
        : validHair[0].id;
      const newClothing = validClothes.find(c => c.id === prev.clothing)
        ? prev.clothing
        : validClothes[0].id;

      const newConfig = {
        ...prev,
        gender: newGender,
        hairStyle: newHair,
        clothing: newClothing,
      } as CharacterConfig;

      try {
        localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(newConfig));
      } catch {
        // Ignore
      }

      return newConfig;
    });
  }, []);

  // Randomize config
  const randomize = useCallback(() => {
    const randomGender = Math.random() > 0.5 ? 'male' : 'female' as Gender;
    const validHair = HAIR_STYLES.filter(h => !h.gender || h.gender === randomGender);
    const validClothes = CLOTHING_ITEMS.filter(c => !c.gender || c.gender === randomGender);

    const randomItem = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

    const newConfig: CharacterConfig = {
      gender: randomGender,
      ageGroup: randomItem(['kid', 'preteen', 'teen', 'young_adult', 'adult'] as const),
      skinTone: randomItem(SKIN_TONES).id as CharacterConfig['skinTone'],
      hairStyle: randomItem(validHair).id as CharacterConfig['hairStyle'],
      hairColor: randomItem(HAIR_COLORS).id as CharacterConfig['hairColor'],
      clothing: randomItem(validClothes).id as CharacterConfig['clothing'],
      clothingColor: randomItem(CLOTHING_COLORS).id as CharacterConfig['clothingColor'],
      eyeColor: randomItem(EYE_COLORS).id as CharacterConfig['eyeColor'],
      accessories: [randomItem(ACCESSORIES).id as CharacterConfig['accessories'][number]],
      transparent: true,
    };

    setConfig(newConfig);
    try {
      localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(newConfig));
    } catch {
      // Ignore
    }
  }, []);

  // Reset to defaults
  const reset = useCallback(() => {
    setConfig(DEFAULT_CONFIG);
    try {
      localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(DEFAULT_CONFIG));
    } catch {
      // Ignore
    }
  }, []);

  return {
    config,
    availableHairStyles,
    availableClothing,
    updateConfig,
    handleGenderChange,
    randomize,
    reset,
  };
}
