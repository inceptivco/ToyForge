/**
 * Figma Plugin Storage Utility
 * Provides a localStorage-like API using Figma's clientStorage API
 */

/**
 * Figma Plugin Storage Adapter
 * Uses Figma's clientStorage API via message passing since localStorage is disabled in data: URLs
 */
class FigmaStorageAdapter {
  private static instance: FigmaStorageAdapter | null = null;
  
  static getInstance(): FigmaStorageAdapter {
    if (!FigmaStorageAdapter.instance) {
      FigmaStorageAdapter.instance = new FigmaStorageAdapter();
    }
    return FigmaStorageAdapter.instance;
  }
  private pendingRequests = new Map<string, { resolve: (value: string | null) => void; reject: (error: Error) => void }>();
  private requestIdCounter = 0;

  constructor() {
    console.log('FigmaStorageAdapter: Setting up message listener');
    
    // Listen for storage responses from plugin code
    // Messages from figma.ui.postMessage() are received in event.data.pluginMessage
    window.onmessage = (event) => {
      // Try both event.data.pluginMessage and event.data (for compatibility)
      const message = event.data.pluginMessage || event.data;
      
      // Debug: Log messages to see what we're receiving
      if (message && typeof message === 'object') {
        if (message.type === 'storage-response' || message.type === 'image-placed' || message.type === 'test') {
          console.log('UI received message from plugin:', message, 'raw event.data:', event.data);
        }
      }
      
      // Only process storage-response messages
      if (message && typeof message === 'object' && message.type === 'storage-response') {
        const { id, value, error } = message;
        console.log('Processing storage-response:', { id, hasValue: value !== null && value !== undefined, hasError: !!error });
        const request = this.pendingRequests.get(id);
        if (request) {
          this.pendingRequests.delete(id);
          if (error) {
            console.error('Storage error response:', error, 'for id:', id);
            request.reject(new Error(error));
          } else {
            console.log('Storage success response for id:', id, 'value:', value ? 'Found' : 'null');
            request.resolve(value);
          }
        } else {
          console.warn('No pending request found for id:', id, 'Pending IDs:', Array.from(this.pendingRequests.keys()));
        }
      }
    };
    
    console.log('FigmaStorageAdapter: Message listener set up');
  }

  private generateId(): string {
    return `storage-${++this.requestIdCounter}-${Date.now()}`;
  }

  async getItem(key: string): Promise<string | null> {
    return new Promise((resolve, reject) => {
      const id = this.generateId();
      this.pendingRequests.set(id, { resolve, reject });

      console.log('Sending storage-get request:', { key, id });

      // Send message to plugin code
      parent.postMessage({
        pluginMessage: {
          type: 'storage-get',
          key,
          id,
        },
      }, '*');

      // Timeout after 5 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          console.error('Storage getItem timeout for key:', key);
          reject(new Error('Storage request timeout'));
        }
      }, 5000);
    });
  }

  async setItem(key: string, value: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const id = this.generateId();
      this.pendingRequests.set(id, {
        resolve: () => resolve(),
        reject,
      });

      // Send message to plugin code
      parent.postMessage({
        pluginMessage: {
          type: 'storage-set',
          key,
          value,
          id,
        },
      }, '*');

      // Timeout after 5 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('Storage request timeout'));
        }
      }, 5000);
    });
  }

  async removeItem(key: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const id = this.generateId();
      this.pendingRequests.set(id, {
        resolve: () => resolve(),
        reject,
      });

      // Send message to plugin code
      parent.postMessage({
        pluginMessage: {
          type: 'storage-remove',
          key,
          id,
        },
      }, '*');

      // Timeout after 5 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('Storage request timeout'));
        }
      }, 5000);
    });
  }
}

// Create storage adapter instance (singleton)
const figmaStorage = FigmaStorageAdapter.getInstance();

/**
 * Synchronous storage wrapper that caches values
 * Note: This provides a sync API but uses async storage under the hood
 */
class SyncStorageWrapper {
  private cache = new Map<string, string | null>();
  private initPromise: Promise<void> | null = null;

  constructor() {
    // Initialize cache on first access
    this.initPromise = this.initializeCache();
  }

  private async initializeCache(): Promise<void> {
    // Pre-load common keys if needed
    // For now, we'll load on-demand
  }

  async ensureInit(): Promise<void> {
    if (this.initPromise) {
      await this.initPromise;
      this.initPromise = null;
    }
  }

  async getItem(key: string): Promise<string | null> {
    await this.ensureInit();
    if (this.cache.has(key)) {
      return this.cache.get(key) ?? null;
    }
    try {
      const value = await figmaStorage.getItem(key);
      this.cache.set(key, value);
      return value;
    } catch (error) {
      console.error('Storage getItem error:', error);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    await this.ensureInit();
    this.cache.set(key, value);
    try {
      await figmaStorage.setItem(key, value);
    } catch (error) {
      console.error('Storage setItem error:', error);
      this.cache.delete(key); // Remove from cache on error
    }
  }

  async removeItem(key: string): Promise<void> {
    await this.ensureInit();
    this.cache.delete(key);
    try {
      await figmaStorage.removeItem(key);
    } catch (error) {
      console.error('Storage removeItem error:', error);
    }
  }
}

const storage = new SyncStorageWrapper();

/**
 * Storage API compatible with localStorage for Supabase
 */
export const figmaStorageAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    return storage.getItem(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    return storage.setItem(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    return storage.removeItem(key);
  },
};

/**
 * Helper for synchronous-like access (for non-Supabase code)
 * Note: This is async but provides a simpler API
 */
export async function getStorageItem(key: string): Promise<string | null> {
  return storage.getItem(key);
}

export async function setStorageItem(key: string, value: string): Promise<void> {
  return storage.setItem(key, value);
}

export async function removeStorageItem(key: string): Promise<void> {
  return storage.removeItem(key);
}

