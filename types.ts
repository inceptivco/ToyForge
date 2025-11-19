
export type AssetId = string;

export interface CharacterConfig {
  gender: 'male' | 'female';
  skinToneId: string;
  hairStyleId: string;
  hairColorId: string;
  clothingId: string;
  clothingColorId: string;
  accessoryId: string;
  eyeColorId: string;
}

export interface AssetOption {
  id: string;
  label: string;
  promptValue: string; // The text description sent to the AI
  gender?: 'male' | 'female'; // Optional constraint
}

export interface ColorPalette {
  id: string;
  name: string;
  hex: string;
  promptValue: string; // The text description sent to the AI
}
