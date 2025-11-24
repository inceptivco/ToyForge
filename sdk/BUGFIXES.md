# Bug Fixes - React Native Cache Manager

## Summary

Fixed two critical bugs in the React Native cache manager that would cause runtime errors and cache misses.

---

## Bug 1: File Object Type Mismatch in `readDirectoryAsync`

### Problem
The `react-native-fs` adapter's `readDirectoryAsync` method was returning file objects instead of strings.

**Location:** Line 110 in `src/cache/native.ts`

**Issue:**
```typescript
// BEFORE (BROKEN)
readDirectoryAsync: async (dirUri: string) => {
  return await RNFS.readDir(dirUri);  // Returns file objects, not strings!
}
```

`RNFS.readDir()` returns an array of objects with properties:
```typescript
{
  name: string;
  path: string;
  size: number;
  // ... other properties
}
```

But the `FileSystemAdapter` interface expects `Promise<string[]>`.

**Impact:**
This caused a runtime error at line 301 in the `clear()` method:
```typescript
for (const file of files) {
  await this.fs.deleteAsync(this.cacheDir + file, { idempotent: true });
  // Tries to concatenate: string + object = "[object Object]"
}
```

### Solution
Extract only the file names from the returned objects:

```typescript
// AFTER (FIXED)
readDirectoryAsync: async (dirUri: string) => {
  const files = await RNFS.readDir(dirUri);
  return files.map((file: any) => file.name);  // Extract just the names
}
```

---

## Bug 2: Race Condition in Metadata Loading

### Problem
The `initialize()` method was called without awaiting in the constructor, creating a race condition.

**Location:** Line 155 in `src/cache/native.ts`

**Issue:**
```typescript
// BEFORE (BROKEN)
constructor() {
  // ...
  if (this.isSupported && this.fs) {
    this.cacheDir = this.fs.documentDirectory + CACHE_DIR;
    this.initialize();  // NOT AWAITED!
  }
}
```

The `initialize()` method loads metadata asynchronously:
```typescript
private async initialize(): Promise<void> {
  // ... creates directory ...
  await this.loadMetadata();  // Loads this.metadata from AsyncStorage
}
```

**Impact:**
If cache methods like `get()`, `set()`, or `delete()` are called immediately after construction, they access `this.metadata` before `loadMetadata()` completes, resulting in:
- **Cache misses** even when cached items exist
- **Inconsistent behavior** depending on timing
- **Lost cache entries** as the empty metadata gets saved

**Example of the race condition:**
```typescript
const cache = new NativeCacheManager();
const result = await cache.get('someKey');
// this.metadata is still {} because loadMetadata() hasn't finished!
// Returns null even if the key exists in storage
```

### Solution
Store the initialization promise and await it in all public methods:

```typescript
// AFTER (FIXED)
export class NativeCacheManager implements CacheManager {
  // ... other properties ...
  private initPromise: Promise<void>;

  constructor() {
    // ...
    if (this.isSupported && this.fs) {
      this.cacheDir = this.fs.documentDirectory + CACHE_DIR;
      this.initPromise = this.initialize();  // Store the promise
    } else {
      this.cacheDir = '';
      this.initPromise = Promise.resolve();  // Resolved promise for unsupported case
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.isSupported || !this.fs) {
      return null;
    }

    // Wait for initialization to complete
    await this.initPromise;

    const entry = this.metadata[key];
    // ... rest of the method
  }

  // Same pattern for set(), delete(), clear()
}
```

Now all public methods wait for initialization before accessing `this.metadata`.

---

## Testing Recommendations

### Bug 1 Testing
```typescript
// Test that clearing cache works with multiple files
const cache = new NativeCacheManager();
await cache.set('key1', 'url1');
await cache.set('key2', 'url2');
await cache.clear();  // Should successfully delete all files
```

### Bug 2 Testing
```typescript
// Test immediate cache access after construction
const cache = new NativeCacheManager();
await cache.set('testKey', 'testUrl');

const cache2 = new NativeCacheManager();
const result = await cache2.get('testKey');  // Should find the cached item
expect(result).toBeTruthy();
```

---

## Files Changed

✅ `sdk/src/cache/native.ts`

## Status

- ✅ Bug 1 Fixed: File names properly extracted from RNFS response
- ✅ Bug 2 Fixed: Initialization race condition resolved
- ✅ No linting errors
- ✅ TypeScript types maintained

Both fixes maintain backward compatibility and don't change the public API.

