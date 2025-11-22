# Migration Guide: API Key Tracking & Soft Delete

## Overview
This migration fixes two critical issues:
1. **Missing `api_key_id` column**: Generations weren't being properly tracked to API keys
2. **Hard delete of API keys**: Deleted API keys were permanently removed, losing audit trail

## Changes Made

### Database Changes (Migration 20240107)
- ✅ Added `api_key_id` column to `generations` table to track which API key made each generation
- ✅ Added `config` column to `generations` table to store full configuration
- ✅ Added `deleted_at` column to `api_keys` table for soft delete support
- ✅ Updated RLS policies to only show active (non-deleted) API keys to users
- ✅ Created indexes for better query performance
- ✅ Created `soft_delete_api_key()` function for safe deletion

### Code Changes

#### 1. ApiKeyManager.tsx
- Changed from hard delete to soft delete (sets `deleted_at` timestamp)
- Only fetches active keys (where `deleted_at IS NULL`)
- Updated confirmation message to clarify past usage is preserved

#### 2. DeveloperDashboard.tsx
- Only counts active API keys (filters out deleted keys)
- Only counts API generations (filters out app usage)

#### 3. generate-character/index.ts
- Now checks if API key has been deleted before allowing usage
- Returns clear error message if key has been revoked

#### 4. BillingView.tsx
- Only shows API usage in usage history (not app usage)
- Updated chart to reflect API-only usage

## How to Apply

### Step 1: Apply Database Migration
Run the migration using Supabase CLI or dashboard:

```bash
# Using Supabase CLI (recommended)
supabase db push

# Or manually apply the migration file:
# supabase/migrations/20240107_add_api_key_tracking.sql
```

### Step 2: Verify Migration
After applying, verify the changes:

```sql
-- Check that api_key_id column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'generations' 
AND column_name IN ('api_key_id', 'config');

-- Check that deleted_at column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'api_keys' 
AND column_name = 'deleted_at';

-- Verify RLS policies
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('api_keys', 'generations');
```

### Step 3: Deploy Code Changes
Deploy the updated application code:
- ApiKeyManager.tsx
- DeveloperDashboard.tsx
- BillingView.tsx
- generate-character/index.ts

## Testing

### Test 1: API Key Creation & Usage
1. Create a new API key in the developer dashboard
2. Make an API call using that key
3. Verify the generation appears in the billing usage history
4. Check that `api_key_id` is properly set in the database:
   ```sql
   SELECT id, user_id, api_key_id, created_at 
   FROM generations 
   WHERE api_key_id IS NOT NULL 
   ORDER BY created_at DESC 
   LIMIT 10;
   ```

### Test 2: API Key Soft Delete
1. Delete an API key from the dashboard
2. Verify it no longer appears in the active keys list
3. Verify it still exists in the database:
   ```sql
   SELECT id, label, deleted_at 
   FROM api_keys 
   WHERE deleted_at IS NOT NULL;
   ```
4. Try to use the deleted key - should get "revoked" error
5. Verify past usage with that key still shows in billing history

### Test 3: API vs App Usage Separation
1. Create a generation via the app (not API)
2. Create a generation via API key
3. Go to developer dashboard
4. Verify only the API generation is counted
5. App usage should not appear in developer dashboard

## Rollback Plan

If issues occur, you can rollback:

```sql
-- Rollback: Remove new columns (will lose tracking data!)
ALTER TABLE generations DROP COLUMN IF EXISTS api_key_id;
ALTER TABLE generations DROP COLUMN IF EXISTS config;
ALTER TABLE api_keys DROP COLUMN IF EXISTS deleted_at;

-- Restore original RLS policies
DROP POLICY IF EXISTS "Users can view own api keys" ON api_keys;
CREATE POLICY "Users can view own api keys" ON api_keys 
FOR SELECT USING (auth.uid() = user_id);
```

**⚠️ Warning**: Rollback will lose all API key tracking and soft delete data!

## Benefits

After this migration:
1. ✅ API usage is properly tracked per API key
2. ✅ Deleted API keys maintain audit trail
3. ✅ Billing history remains accurate even after key deletion
4. ✅ Better separation between app usage and API usage
5. ✅ Improved compliance for tracking and auditing
6. ✅ Users can revoke keys without losing historical data

## Support

If you encounter issues:
1. Check Supabase logs for migration errors
2. Verify all indexes were created
3. Test RLS policies with a test user
4. Check edge function logs for API key validation

