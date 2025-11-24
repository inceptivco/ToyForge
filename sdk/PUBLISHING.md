# Publishing Guide for @characterforge/sdk

This guide walks you through publishing the CharacterForge SDK to npm.

## Prerequisites

Before you can publish, you'll need:

1. **npm Account**
   - Create an account at [npmjs.com](https://www.npmjs.com/signup)
   - Verify your email address

2. **Organization Setup (Optional but Recommended)**
   - Create an organization: `@characterforge`
   - This allows you to publish scoped packages like `@characterforge/sdk`
   - Organizations can have multiple maintainers and better access control

3. **Node.js & npm**
   - Ensure you have Node.js 16+ and npm 7+ installed
   - Check versions: `node -v` && `npm -v`

4. **Git Repository**
   - Ensure your code is committed to a git repository
   - Tag releases for version tracking

## One-Time Setup

### 1. Login to npm

```bash
npm login
```

You'll be prompted for:
- Username
- Password
- Email
- One-time password (if 2FA is enabled)

Verify you're logged in:
```bash
npm whoami
```

### 2. Configure Organization (if using scoped package)

If you haven't created the `@characterforge` organization yet:

1. Go to [npmjs.com](https://www.npmjs.com)
2. Click your profile → "Add Organization"
3. Follow the prompts to create `@characterforge`

### 3. Update package.json

Ensure these fields are set correctly in `package.json`:

```json
{
  "name": "@characterforge/sdk",
  "version": "1.0.0",
  "description": "AI-powered 3D character generation SDK for web and React Native",
  "repository": {
    "type": "git",
    "url": "https://github.com/characterforge/sdk"
  },
  "homepage": "https://characterforge.app",
  "bugs": {
    "url": "https://github.com/characterforge/sdk/issues"
  },
  "author": "CharacterForge",
  "license": "MIT"
}
```

## Publishing Workflow

### Step 1: Update the Base URL

Before publishing, update the default base URL in `src/client.ts`:

```typescript
// Replace YOUR_SUPABASE_PROJECT with your actual Supabase project ID
const DEFAULT_BASE_URL = 'https://YOUR_SUPABASE_PROJECT.supabase.co/functions/v1';
```

Find your Supabase project URL:
1. Go to your Supabase project dashboard
2. Click "Settings" → "API"
3. Copy the "URL" field
4. Add `/functions/v1` to the end

Example: `https://abcdefghijklmnop.supabase.co/functions/v1`

### Step 2: Install Dependencies

From the `/sdk` directory:

```bash
npm install
```

### Step 3: Build the Package

```bash
npm run build
```

This will:
- Compile TypeScript to JavaScript (ESM and CJS)
- Generate type definition files (.d.ts)
- Output everything to the `dist/` directory

Verify the build output in `dist/`:
```bash
ls -la dist/
# Should see: index.js, index.mjs, index.d.ts, etc.
```

### Step 4: Test Locally (Highly Recommended)

Before publishing, test the package locally:

#### Create a test tarball
```bash
npm pack
```

This creates a `.tgz` file like `characterforge-sdk-1.0.0.tgz`

#### Test in another project
```bash
# In a test project directory
npm install /path/to/characterforge-sdk-1.0.0.tgz

# Or directly from the SDK directory
npm install ../sdk
```

#### Test the installation
Create a test file:

```typescript
// test.ts
import { createCharacterForgeClient } from '@characterforge/sdk';

const client = createCharacterForgeClient({
  apiKey: 'test-key',
});

console.log('SDK loaded successfully!');
```

Run it:
```bash
npx tsx test.ts
# or
node test.js
```

### Step 5: Version Management

Use semantic versioning (semver):

- **Patch** (1.0.0 → 1.0.1): Bug fixes
- **Minor** (1.0.0 → 1.1.0): New features, backward compatible
- **Major** (1.0.0 → 2.0.0): Breaking changes

Update version:
```bash
# Patch release (bug fixes)
npm version patch

# Minor release (new features)
npm version minor

# Major release (breaking changes)
npm version major
```

Or manually edit `package.json` and `src/index.ts`:
```json
{
  "version": "1.0.1"
}
```

```typescript
// src/index.ts
export const VERSION = '1.0.1';
```

### Step 6: Commit and Tag

```bash
git add .
git commit -m "Release v1.0.0"
git tag v1.0.0
git push origin main --tags
```

### Step 7: Publish to npm

#### Dry Run (Recommended)

Test what will be published without actually publishing:

```bash
npm publish --dry-run
```

Review the output to ensure only the correct files are included.

#### Publish for Real

For scoped packages (first time):
```bash
npm publish --access public
```

For subsequent releases:
```bash
npm publish
```

### Step 8: Verify Publication

1. Check npm:
   ```bash
   npm view @characterforge/sdk
   ```

2. Visit npm page:
   - https://www.npmjs.com/package/@characterforge/sdk

3. Test installation in a fresh project:
   ```bash
   mkdir test-install
   cd test-install
   npm init -y
   npm install @characterforge/sdk
   ```

## Updating the Package

When you need to publish an update:

1. Make your changes
2. Update tests (if you add them later)
3. Update README.md if API changes
4. Bump version: `npm version patch|minor|major`
5. Rebuild: `npm run build`
6. Test locally with `npm pack`
7. Commit and tag: `git commit -am "v1.0.1" && git tag v1.0.1`
8. Publish: `npm publish`
9. Push to git: `git push origin main --tags`

## Common Issues

### Issue: "You cannot publish over the previously published versions"

**Solution:** You're trying to publish a version that already exists. Bump your version number.

```bash
npm version patch
npm publish
```

### Issue: "You do not have permission to publish"

**Solutions:**
1. Ensure you're logged in: `npm whoami`
2. Check you have access to the organization
3. For first-time scoped package: `npm publish --access public`

### Issue: "Package name too similar to existing package"

**Solution:** npm prevents similar package names. Choose a different name or use a scope like `@characterforge/sdk`.

### Issue: Build files missing in published package

**Solution:** Check `.npmignore` isn't excluding necessary files. Ensure `files` field in `package.json` includes the `dist` folder:

```json
{
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ]
}
```

### Issue: TypeScript types not working

**Solution:** Ensure these fields in `package.json`:

```json
{
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.js"
    }
  }
}
```

## Best Practices

1. **Always test locally first** - Use `npm pack` and install in a test project
2. **Use semantic versioning** - Follow semver rules strictly
3. **Write a changelog** - Keep a CHANGELOG.md for users
4. **Tag releases in git** - Makes it easy to track what code is in each release
5. **Never delete published versions** - Use `npm deprecate` instead
6. **Enable 2FA** - Secure your npm account with two-factor authentication
7. **Use npm provenance** - Starting with npm 9+, use `--provenance` flag for better security

## Deprecating a Version

If you need to deprecate a version:

```bash
npm deprecate @characterforge/sdk@1.0.0 "This version has a critical bug. Please upgrade to 1.0.1"
```

## Unpublishing (Use with Caution)

You can only unpublish within 72 hours of publishing:

```bash
npm unpublish @characterforge/sdk@1.0.0
```

**Warning:** Unpublishing breaks projects that depend on that version. Use deprecation instead.

## Setting up Automated Publishing (Advanced)

For CI/CD automated publishing:

1. Generate an npm token:
   ```bash
   npm token create
   ```

2. Add to GitHub Secrets (or your CI provider)
   - Name: `NPM_TOKEN`
   - Value: Your token

3. Create GitHub Action (`.github/workflows/publish.yml`):
   ```yaml
   name: Publish to npm
   
   on:
     release:
       types: [created]
   
   jobs:
     publish:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - uses: actions/setup-node@v3
           with:
             node-version: '18'
             registry-url: 'https://registry.npmjs.org'
         - run: npm ci
         - run: npm run build
         - run: npm publish --access public
           env:
             NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
   ```

## Support

If you encounter issues during publishing:

1. Check [npm documentation](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
2. Ask on [npm community forum](https://npm.community/)
3. Contact npm support

## Resources

- [npm Publishing Guide](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [Semantic Versioning](https://semver.org/)
- [npm CLI Documentation](https://docs.npmjs.com/cli/v9)
- [Creating Organizations](https://docs.npmjs.com/creating-an-organization)

