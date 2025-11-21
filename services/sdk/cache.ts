
import { CacheManager } from './types';

const DB_NAME = 'CharacterForgeDB';
const STORE_NAME = 'images';
const DB_VERSION = 1;

export class WebCacheManager implements CacheManager {
    private dbPromise: Promise<IDBDatabase>;

    constructor() {
        this.dbPromise = this.openDB();
    }

    private openDB(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            if (!window.indexedDB) {
                reject(new Error('IndexedDB not supported'));
                return;
            }

            const request = window.indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME);
                }
            };
        });
    }

    async get(key: string): Promise<string | null> {
        try {
            const db = await this.dbPromise;
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(STORE_NAME, 'readonly');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.get(key);

                request.onerror = () => reject(request.error);
                request.onsuccess = () => {
                    const blob = request.result as Blob;
                    if (blob) {
                        resolve(URL.createObjectURL(blob));
                    } else {
                        resolve(null);
                    }
                };
            });
        } catch (error) {
            console.warn('Cache retrieval failed:', error);
            return null;
        }
    }

    async set(key: string, data: Blob | string): Promise<string> {
        try {
            const db = await this.dbPromise;

            // Ensure data is a Blob
            let blob: Blob;
            if (typeof data === 'string') {
                // If it's a URL, we might need to fetch it first if we want to store the blob
                // But for now, let's assume the input to set is likely a Blob from the generation response
                // or we fetch it here.
                const response = await fetch(data);
                blob = await response.blob();
            } else {
                blob = data;
            }

            return new Promise((resolve, reject) => {
                const transaction = db.transaction(STORE_NAME, 'readwrite');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.put(blob, key);

                request.onerror = () => reject(request.error);
                request.onsuccess = () => {
                    resolve(URL.createObjectURL(blob));
                };
            });
        } catch (error) {
            console.warn('Cache storage failed:', error);
            // Fallback: just return the input if it was a string URL, or create a temp URL
            if (typeof data === 'string') return data;
            return URL.createObjectURL(data);
        }
    }

    async clear(): Promise<void> {
        const db = await this.dbPromise;
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.clear();

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }
}
