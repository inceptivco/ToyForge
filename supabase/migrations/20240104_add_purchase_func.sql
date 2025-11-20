create or replace function public.handle_purchase(
  p_user_id uuid,
  p_amount int,
  p_ref_id text
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

  -- Add Credits
  update public.profiles
  set credits_balance = credits_balance + p_amount
  where id = p_user_id;

  -- Log Transaction
  insert into public.transactions (user_id, amount, type, reference_id)
  values (p_user_id, p_amount, 'PURCHASE', p_ref_id);

  return true;
end;
$$ language plpgsql security definer;
