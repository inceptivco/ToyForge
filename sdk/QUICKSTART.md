# Quick Start - Publishing Your SDK

Follow these 5 steps to publish your CharacterForge SDK to npm.

## Step 1: Update the Base URL ⚠️

**File:** `src/client.ts` (line 32)

Change this line:
```typescript
const DEFAULT_BASE_URL = 'https://YOUR_SUPABASE_PROJECT.supabase.co/functions/v1';
```

To your actual Supabase URL. You can find it:
1. In your `.env.local` file as `VITE_SUPABASE_URL`
2. Or in Supabase Dashboard → Settings → API → URL

**Example:**
```typescript
const DEFAULT_BASE_URL = 'https://abcdefghijklmnop.supabase.co/functions/v1';
```

## Step 2: Install Dependencies

```bash
cd sdk
npm install
```

This installs `tsup` and `typescript` for building.

## Step 3: Build the Package

```bash
npm run build
```

Verify the `dist/` folder was created with:
- `index.js` (CommonJS)
- `index.mjs` (ES Modules)  
- `index.d.ts` (TypeScript types)

## Step 4: Test Locally

```bash
# Create a test package
npm pack
```

This creates `characterforge-1.0.0.tgz`.

**Test it in another project:**
```bash
# In a different directory
mkdir test-sdk
cd test-sdk
npm init -y
npm install /path/to/sdk/characterforge-1.0.0.tgz
```

**Create a test file** (`test.js`):
```javascript
const { createCharacterForgeClient } = require('characterforge');

const client = createCharacterForgeClient({
  apiKey: 'test-key-here',
});

console.log('✅ SDK loaded successfully!');
```

Run it:
```bash
node test.js
```

## Step 5: Publish to npm

### First Time Setup

```bash
# Login to npm
npm login
```

### Publish

```bash
# Publish the package
npm publish

# Check it published
npm view characterforge
```

## 🎉 Done!

Your SDK is now live at: https://www.npmjs.com/package/characterforge

Users can install it with:
```bash
npm install characterforge
```

## Next Steps

- Update your main README to reference the SDK
- Share the npm package link with users
- Set up GitHub repo for the SDK (optional)
- Consider setting up automated publishing with GitHub Actions

## Publishing Updates

When you make changes:

```bash
# 1. Update version
npm version patch  # or minor, or major

# 2. Rebuild
npm run build

# 3. Publish
npm publish

# 4. Tag in git (if using git)
git add .
git commit -m "Release v1.0.1"
git tag v1.0.1
git push origin main --tags
```

## Need Help?

Check the full guides:
- `SETUP_SUMMARY.md` - Complete overview
- `PUBLISHING.md` - Detailed publishing guide
- `README.md` - User documentation

---

**Remember:** Always test locally with `npm pack` before publishing!

