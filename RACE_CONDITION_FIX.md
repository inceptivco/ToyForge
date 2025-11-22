# Race Condition Fix: Rapid Generation Errors

## Problem

When users generate characters rapidly in the app, they get "Unable to generate image" errors even though the Edge function logs look fine. This was particularly noticeable when clicking "Generate" multiple times quickly.

## Root Cause

The issue was caused by a **race condition in the credit deduction logic**:

### The Original Flow (Flawed):

1. **Request 1** arrives → Check credits (has 5 credits) ✅
2. **Request 2** arrives → Check credits (still has 5 credits) ✅  
3. **Request 1** → Deduct 1 credit (atomic operation succeeds, now 4 credits)
4. **Request 2** → Deduct 1 credit (atomic operation succeeds, now 3 credits)
5. Both proceed...

BUT if they arrive even faster:

1. **Request 1** → Check credits (has 1 credit) ✅
2. **Request 2** → Check credits (still has 1 credit) ✅
3. **Request 1** → Deduct 1 credit (atomic operation succeeds, now 0 credits)
4. **Request 2** → Deduct 1 credit (atomic operation FAILS - insufficient credits)
5. **Problem**: The code only checked `deductResult.error`, not `deductResult.data` (the boolean return value)
6. **Result**: Request 2 proceeded with generation despite failed deduction!
7. **Later**: Generation insert or other operation would fail, causing "Unable to generate image"

### Additional Issues:

1. **Missing return value check**: The `deduct_credits` function returns a `boolean` (true on success, false on failure), but the code only checked for `error`, not the return value
2. **Reference ID collisions**: Using `Date.now()` alone meant rapid requests could get the same reference ID, potentially causing transaction log issues
3. **Poor error handling**: When deduction failed, the error wasn't properly surfaced to the user

## The Fix

### 1. Check Boolean Return Value
```typescript
// OLD CODE (missing check):
if (deductResult.error) {
  throw new Error('Failed to deduct credits');
}
// Proceeds even if deductResult.data === false!

// NEW CODE (proper check):
if (deductResult.error) {
  throw new Error('Failed to deduct credits: ' + deductResult.error.message);
}

// Check if deduction was successful (function returns boolean)
if (!deductResult.data) {
  return new Response(JSON.stringify({ 
    error: 'Insufficient credits. Please purchase more credits to continue generating characters.' 
  }), { 
    status: 402, 
    headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
  });
}
```

### 2. Unique Reference IDs
```typescript
// OLD CODE (collision-prone):
p_ref_id: 'gen_' + Date.now()

// NEW CODE (unique per request):
const refId = `gen_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
p_ref_id: refId
```

### 3. Proper Refund Handling
```typescript
// OLD CODE (fire and forget):
await supabase.rpc('deduct_credits', {
  p_ref_id: 'refund_' + Date.now(), // Could collide!
  // ... no error checking
});

// NEW CODE (tracked and logged):
const refundResult = await supabase.rpc('deduct_credits', {
  p_ref_id: `refund_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
  // ...
});

if (refundResult.error) {
  console.error('[generate-character] Failed to refund credits:', refundResult.error);
} else {
  console.log('[generate-character] Credits refunded successfully');
}
```

### 4. Scope for Error Handling
```typescript
// Moved creditType to outer scope so it's available in catch block for refunds
let creditType: 'api' | 'app' = 'app';
```

## How the deduct_credits Function Works

From `20240106_fix_deduct_credits.sql`:

```sql
-- Atomic UPDATE with WHERE clause checks balance and deducts in one operation
update public.profiles
set api_credits_balance = api_credits_balance - p_amount
where id = p_user_id
  and api_credits_balance >= p_amount;  -- Atomic check!

-- Returns true if row was updated, false if balance was insufficient
get diagnostics affected_rows = row_count;
return (affected_rows > 0);
```

This is **atomic** - it either succeeds (returns true) or fails (returns false), preventing race conditions. The issue was that we weren't checking the return value!

## Testing the Fix

### Test 1: Rapid Clicks (Race Condition)
1. Set your account to have exactly 2 credits
2. Click "Generate" twice very quickly (within 100ms)
3. **Expected**: First request succeeds, second request gets proper error: "Insufficient credits"
4. **Before fix**: Second request would fail with "Unable to generate image"

### Test 2: Normal Usage
1. Generate a character normally
2. **Expected**: Works as before, credits deducted properly

### Test 3: Refund on Failure
1. Simulate an AI error (disconnect network during generation)
2. **Expected**: Credits are refunded with proper logging
3. Check transaction log to verify refund was recorded

## Benefits

✅ **Eliminates race conditions** - Atomic operations properly checked  
✅ **Better error messages** - Users see "Insufficient credits" instead of generic errors  
✅ **Audit trail** - Unique reference IDs prevent collision in transaction logs  
✅ **Reliable refunds** - Failed generations properly refund credits with logging  
✅ **Improved debugging** - Better console logging for credit operations  

## Files Modified

1. `supabase/functions/generate-character/index.ts`
   - Added boolean return value check for `deduct_credits`
   - Unique reference ID generation
   - Proper refund error handling
   - Moved `creditType` to outer scope

## Deployment Notes

No database changes required - this is a code-only fix. Just deploy the updated Edge function:

```bash
# Deploy edge function
supabase functions deploy generate-character
```

## Related Issues

This fix works in conjunction with:
- Migration `20240106_fix_deduct_credits.sql` - Atomic credit deduction
- Migration `20240107_add_api_key_tracking.sql` - API key tracking (separate issue)

