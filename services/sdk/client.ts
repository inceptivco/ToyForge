
import { CharacterConfig } from '../../types';
import { supabase } from '../supabase';
import { WebCacheManager } from './cache';
import { CacheManager, CharacterForgeClientConfig } from './types';

export class CharacterForgeClient {
    private cacheManager: CacheManager;
    private config: CharacterForgeClientConfig;

    constructor(config: CharacterForgeClientConfig = {}) {
        this.config = {
            cache: true, // Default to true as requested
            ...config,
        };
        // In a real universal SDK, we'd detect platform here.
        // For now, we default to WebCacheManager.
        this.cacheManager = new WebCacheManager();
    }

    /**
     * Generates a character image based on the configuration.
     * Checks local cache first if enabled.
     */
    async generate(
        characterConfig: CharacterConfig,
        onStatusUpdate?: (status: string) => void
    ): Promise<string> {
        // Explicitly check for false to allow cache bypass
        const shouldCache = this.config.cache && (characterConfig.cache !== false);
        const cacheKey = this.generateCacheKey(characterConfig);

        if (shouldCache) {
            const cachedUrl = await this.cacheManager.get(cacheKey);
            if (cachedUrl) {
                onStatusUpdate?.('Retrieved from Client Cache!');
                return cachedUrl;
            }
        }

        // Cache miss or disabled: Call API
        onStatusUpdate?.('Calling AI Cloud...');

        // We invoke the edge function. 
        // Note: The edge function itself might have server-side caching (Redis/Postgres),
        // but here we are implementing client-side caching to save network requests.
        const { data, error } = await supabase.functions.invoke('generate-character', {
            body: characterConfig,
        });

        if (error) {
            throw new Error(error.message || "Failed to call generation service");
        }

        if (data.error) {
            throw new Error(data.error);
        }

        const imageUrl = data.image;

        if (shouldCache && imageUrl) {
            // Store in local cache
            // We fetch the image to store it as a Blob
            try {
                onStatusUpdate?.('Caching result...');
                await this.cacheManager.set(cacheKey, imageUrl);
                // We return the cached URL (blob:...) to ensure immediate availability and consistency
                const cachedUrl = await this.cacheManager.get(cacheKey);
                if (cachedUrl) return cachedUrl;
            } catch (err) {
                console.warn('Failed to cache image:', err);
            }
        }

        return imageUrl;
    }

    /**
     * Simple deterministic cache key generation.
     * Sorts keys to ensure {a:1, b:2} is same as {b:2, a:1}
     */
    private generateCacheKey(config: CharacterConfig): string {
        // Exclude non-visual props if any (none currently, but good practice)
        // We include everything that affects the image.
        const keys = Object.keys(config).sort();
        const stableObj: any = {};
        for (const key of keys) {
            stableObj[key] = (config as any)[key];
        }
        return JSON.stringify(stableObj);
    }

    async clearCache(): Promise<void> {
        await this.cacheManager.clear();
    }
}

// Singleton instance for easy usage
export const characterForgeClient = new CharacterForgeClient();
