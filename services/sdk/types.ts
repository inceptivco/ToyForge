
import { CharacterConfig } from '../../types';

export type { CharacterConfig };

export interface CacheManager {
    get(key: string): Promise<string | null>;
    set(key: string, data: Blob | string): Promise<string>;
    clear(): Promise<void>;
}

export interface GenerationResult {
    image: string; // URL (local or remote)
    cached: boolean;
}

export interface CharacterForgeClientConfig {
    apiKey?: string; // For future use if we move to direct client calls
    cache?: boolean; // Global cache setting
}
