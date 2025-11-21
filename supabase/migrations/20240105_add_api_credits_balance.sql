-- Add api_credits_balance column to profiles table
alter table public.profiles 
add column if not exists api_credits_balance int default 0 not null;

-- Create or replace function to handle purchases for both credit types
create or replace function public.handle_purchase_v2(
  p_user_id uuid,
  p_amount int,
  p_ref_id text,
  p_credit_type text default 'app' -- 'app' or 'api'
)
returns boolean as $$
declare
  exists_check boolean;
begin
  -- Idempotency Check
  select exists(
    select 1 from public.transactions 
    where reference_id = p_ref_id 
    and type = 'PURCHASE'
  ) into exists_check;

  if exists_check then
    return true; -- Already processed
  end if;

  -- Add Credits based on type
  if p_credit_type = 'api' then
    update public.profiles
    set api_credits_balance = api_credits_balance + p_amount
    where id = p_user_id;
  else
    update public.profiles
    set credits_balance = credits_balance + p_amount
    where id = p_user_id;
  end if;

  -- Log Transaction
  insert into public.transactions (user_id, amount, type, reference_id)
  values (p_user_id, p_amount, 'PURCHASE', p_ref_id);

  return true;
end;
$$ language plpgsql security definer;

