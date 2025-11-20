-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES (Extends auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  credits_balance int default 0 not null,
  stripe_customer_id text,
  is_api_enabled boolean default false,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using ( auth.uid() = id );

create policy "Users can update own profile" -- mainly for stripe_customer_id if needed, but usually backend handles this
  on public.profiles for update
  using ( auth.uid() = id );

-- 2. API KEYS
create table public.api_keys (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  key_hash text not null, -- We store a hash of the key
  label text,
  last_used_at timestamptz,
  created_at timestamptz default now()
);

alter table public.api_keys enable row level security;

create policy "Users can view own api keys"
  on public.api_keys for select
  using ( auth.uid() = user_id );

create policy "Users can create api keys"
  on public.api_keys for insert
  with check ( auth.uid() = user_id );

create policy "Users can delete own api keys"
  on public.api_keys for delete
  using ( auth.uid() = user_id );

-- 3. GENERATIONS (The Cache & History)
create table public.generations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete set null, -- set null so we keep history even if user is gone? or cascade.
  config_hash text not null,
  image_url text not null,
  prompt_used text,
  cost_in_credits int default 1,
  created_at timestamptz default now()
);

-- Index for fast cache lookups
create index idx_generations_config_hash on public.generations(config_hash);

alter table public.generations enable row level security;

create policy "Users can view own generations"
  on public.generations for select
  using ( auth.uid() = user_id );

-- 4. TRANSACTIONS (Audit Log)
create table public.transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  amount int not null, -- Positive for buy, negative for spend
  type text not null check (type in ('PURCHASE', 'GENERATION', 'REFUND', 'BONUS')),
  reference_id text, -- Stripe Session ID or Generation ID
  created_at timestamptz default now()
);

alter table public.transactions enable row level security;

create policy "Users can view own transactions"
  on public.transactions for select
  using ( auth.uid() = user_id );

-- 5. FUNCTIONS & TRIGGERS

-- Handle New User Signup (Create Profile + Give Free Credits)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, credits_balance)
  values (new.id, 3); -- 3 Free Credits

  insert into public.transactions (user_id, amount, type, reference_id)
  values (new.id, 3, 'BONUS', 'SIGNUP_BONUS');

  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to safely deduct credits (Atomic)
create or replace function public.deduct_credits(
  p_user_id uuid,
  p_amount int,
  p_ref_id text
)
returns boolean as $$
declare
  current_bal int;
begin
  -- Lock the row for update
  select credits_balance into current_bal
  from public.profiles
  where id = p_user_id
  for update;

  if current_bal >= p_amount then
    -- Deduct
    update public.profiles
    set credits_balance = credits_balance - p_amount
    where id = p_user_id;

    -- Log Transaction
    insert into public.transactions (user_id, amount, type, reference_id)
    values (p_user_id, -p_amount, 'GENERATION', p_ref_id);

    return true;
  else
    return false;
  end if;
end;
$$ language plpgsql security definer;
