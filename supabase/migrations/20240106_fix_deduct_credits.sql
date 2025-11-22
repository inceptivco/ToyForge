-- Fix deduct_credits function to support credit_type parameter and fix SELECT ... INTO issue
-- Uses UPDATE with WHERE clause to check balance atomically, avoiding SELECT ... INTO
-- Supports negative amounts for refunds (adds credits back)
create or replace function public.deduct_credits(
  p_user_id uuid,
  p_amount int,
  p_ref_id text,
  p_credit_type text default 'app' -- 'app' or 'api'
)
returns boolean as $$
declare
  affected_rows int;
begin
  -- Handle negative amounts (refunds) - no balance check needed, just add credits
  if p_amount < 0 then
    if p_credit_type = 'api' then
      update public.profiles
      set api_credits_balance = api_credits_balance - p_amount  -- Subtracting negative = adding
      where id = p_user_id;
    else
      update public.profiles
      set credits_balance = credits_balance - p_amount  -- Subtracting negative = adding
      where id = p_user_id;
    end if;
    
    get diagnostics affected_rows = row_count;
    
    -- Log Transaction (refund)
    if affected_rows > 0 then
      insert into public.transactions (user_id, amount, type, reference_id)
      values (p_user_id, -p_amount, 'REFUND', p_ref_id);
      return true;
    else
      return false;
    end if;
  end if;

  -- Handle positive amounts (deductions) - check balance atomically
  -- Use UPDATE with WHERE clause to atomically check balance and deduct
  -- This avoids SELECT ... INTO which doesn't work when called via RPC
  if p_credit_type = 'api' then
    update public.profiles
    set api_credits_balance = api_credits_balance - p_amount
    where id = p_user_id
      and api_credits_balance >= p_amount;
  else
    update public.profiles
    set credits_balance = credits_balance - p_amount
    where id = p_user_id
      and credits_balance >= p_amount;
  end if;

  -- Check if any rows were affected using GET DIAGNOSTICS
  get diagnostics affected_rows = row_count;

  -- Log Transaction (only if deduction was successful)
  if affected_rows > 0 then
    insert into public.transactions (user_id, amount, type, reference_id)
    values (p_user_id, -p_amount, 'GENERATION', p_ref_id);
    return true;
  else
    return false;
  end if;
end;
$$ language plpgsql security definer;

