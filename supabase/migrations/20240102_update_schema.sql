-- Add columns to profiles if they don't exist
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'credits_balance') then
    alter table public.profiles add column credits_balance int default 0 not null;
  end if;

  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'stripe_customer_id') then
    alter table public.profiles add column stripe_customer_id text;
  end if;

  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'is_api_enabled') then
    alter table public.profiles add column is_api_enabled boolean default false;
  end if;
end $$;

-- Create API Keys
create table if not exists public.api_keys (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  key_hash text not null,
  label text,
  last_used_at timestamptz,
  created_at timestamptz default now()
);

-- Create Generations
create table if not exists public.generations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete set null,
  config_hash text not null,
  image_url text not null,
  prompt_used text,
  cost_in_credits int default 1,
  created_at timestamptz default now()
);

-- Create Transactions
create table if not exists public.transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  amount int not null,
  type text not null check (type in ('PURCHASE', 'GENERATION', 'REFUND', 'BONUS')),
  reference_id text,
  created_at timestamptz default now()
);

-- Enable RLS (idempotent)
alter table public.profiles enable row level security;
alter table public.api_keys enable row level security;
alter table public.generations enable row level security;
alter table public.transactions enable row level security;

-- Policies (Drop and Recreate to be safe or use IF NOT EXISTS logic which is hard in SQL directly, so I'll just drop if exists)
drop policy if exists "Users can view own api keys" on public.api_keys;
create policy "Users can view own api keys" on public.api_keys for select using ( auth.uid() = user_id );

drop policy if exists "Users can create api keys" on public.api_keys;
create policy "Users can create api keys" on public.api_keys for insert with check ( auth.uid() = user_id );

drop policy if exists "Users can delete own api keys" on public.api_keys;
create policy "Users can delete own api keys" on public.api_keys for delete using ( auth.uid() = user_id );

drop policy if exists "Users can view own generations" on public.generations;
create policy "Users can view own generations" on public.generations for select using ( auth.uid() = user_id );

drop policy if exists "Users can view own transactions" on public.transactions;
create policy "Users can view own transactions" on public.transactions for select using ( auth.uid() = user_id );

-- Functions
create or replace function public.handle_new_user()
returns trigger as $$
begin
  -- Check if profile exists (it might if created by another trigger)
  if not exists (select 1 from public.profiles where id = new.id) then
      insert into public.profiles (id, credits_balance)
      values (new.id, 3);
  else
      update public.profiles set credits_balance = credits_balance + 3 where id = new.id;
  end if;

  insert into public.transactions (user_id, amount, type, reference_id)
  values (new.id, 3, 'BONUS', 'SIGNUP_BONUS');

  return new;
end;
$$ language plpgsql security definer;

-- Trigger (Drop and Recreate)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.deduct_credits(
  p_user_id uuid,
  p_amount int,
  p_ref_id text
)
returns boolean as $$
declare
  current_bal int;
begin
  select credits_balance into current_bal
  from public.profiles
  where id = p_user_id
  for update;

  if current_bal >= p_amount then
    update public.profiles
    set credits_balance = credits_balance - p_amount
    where id = p_user_id;

    insert into public.transactions (user_id, amount, type, reference_id)
    values (p_user_id, -p_amount, 'GENERATION', p_ref_id);

    return true;
  else
    return false;
  end if;
end;
$$ language plpgsql security definer;
