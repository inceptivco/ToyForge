-- Migration: Add API key tracking to generations and soft delete for API keys
-- This allows us to:
-- 1. Track which API key was used for each generation
-- 2. Keep deleted API keys in the database for audit/billing purposes

-- Add api_key_id column to generations table if it doesn't exist
do $$
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_name = 'generations' 
    and column_name = 'api_key_id'
  ) then
    alter table public.generations 
    add column api_key_id uuid references public.api_keys(id) on delete set null;
    
    -- Add index for faster queries filtering by API key
    create index idx_generations_api_key_id on public.generations(api_key_id);
    
    -- Add index for filtering non-null API key IDs (API usage only)
    create index idx_generations_api_usage on public.generations(user_id, api_key_id) 
    where api_key_id is not null;
  end if;
end $$;

-- Add config column to generations table if it doesn't exist (for storing full config)
do $$
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_name = 'generations' 
    and column_name = 'config'
  ) then
    alter table public.generations 
    add column config jsonb;
  end if;
end $$;

-- Add soft delete support to api_keys table
do $$
begin
  -- Add deleted_at column for soft deletes
  if not exists (
    select 1 from information_schema.columns 
    where table_name = 'api_keys' 
    and column_name = 'deleted_at'
  ) then
    alter table public.api_keys 
    add column deleted_at timestamptz;
    
    -- Add index for filtering active keys
    create index idx_api_keys_active on public.api_keys(user_id, deleted_at) 
    where deleted_at is null;
  end if;
end $$;

-- Update RLS policies to only show active (non-deleted) API keys to users
drop policy if exists "Users can view own api keys" on public.api_keys;
create policy "Users can view own api keys" on public.api_keys 
for select 
using ( 
  auth.uid() = user_id 
  and deleted_at is null  -- Only show active keys
);

-- Users can still "delete" their own keys (but it's a soft delete via update)
drop policy if exists "Users can delete own api keys" on public.api_keys;
create policy "Users can delete own api keys" on public.api_keys 
for delete 
using ( auth.uid() = user_id );

-- Allow users to update their own keys (for soft delete)
drop policy if exists "Users can update own api keys" on public.api_keys;
create policy "Users can update own api keys" on public.api_keys 
for update 
using ( auth.uid() = user_id );

-- Create a function to soft delete API keys
create or replace function public.soft_delete_api_key(p_key_id uuid)
returns boolean as $$
begin
  update public.api_keys
  set deleted_at = now()
  where id = p_key_id
    and deleted_at is null  -- Only delete if not already deleted
    and user_id = auth.uid();  -- Security check
  
  return found;
end;
$$ language plpgsql security definer;

-- Comment on the soft delete approach
comment on column public.api_keys.deleted_at is 
'Timestamp when the API key was deleted. NULL means active. We use soft deletes to maintain audit trail and billing history.';

comment on column public.generations.api_key_id is 
'References the API key used to create this generation. NULL means it was created via the app UI. Foreign key uses ON DELETE SET NULL to preserve history even if key is hard-deleted.';

