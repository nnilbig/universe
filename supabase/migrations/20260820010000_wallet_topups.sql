-- WHONEXT UNIVERSE — wallet top-up ledger
-- Paste into Supabase Dashboard > SQL Editor > New query, run once after 20260820000000.
--
-- Backs the admin batch top-up screen (pick members, LinePay/現金 + 金額 per member, edited inline
-- then submitted all at once) and gives the wallet page's 儲值紀錄 list something real to read from
-- later.

create table public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  amount integer not null check (amount <> 0),
  method text not null check (method in ('linepay', 'cash')),
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

create index wallet_transactions_profile_idx on public.wallet_transactions (profile_id, created_at desc);

alter table public.wallet_transactions enable row level security;

-- A member can see their own top-up history; admin/owner can see everyone's. No insert/update/
-- delete policy — the only way in is through adjust_wallet_balance() below.
create policy "wallet transactions viewable by owner or staff" on public.wallet_transactions
  for select using (
    profile_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'owner'))
  );

-- Replaces the delta-only adjust_wallet_balance(uuid, integer) from 20260820000000.sql — arg list
-- changed (added p_method), so the old signature needs an explicit drop first or it'd stick around
-- as a separate overload.
drop function if exists public.adjust_wallet_balance(uuid, integer);

create or replace function public.adjust_wallet_balance(p_user_id uuid, p_delta integer, p_method text)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_role text;
  v_result public.profiles;
begin
  select role into v_caller_role from public.profiles where id = auth.uid();
  if v_caller_role is null or v_caller_role not in ('admin', 'owner') then
    raise exception 'only admin/owner may adjust wallet balances';
  end if;
  if p_method not in ('linepay', 'cash') then
    raise exception 'invalid top-up method: %', p_method;
  end if;

  update public.profiles
  set wallet_balance = greatest(0, wallet_balance + p_delta)
  where id = p_user_id
  returning * into v_result;

  if v_result is null then
    raise exception 'profile % not found', p_user_id;
  end if;

  insert into public.wallet_transactions (profile_id, amount, method, created_by)
  values (p_user_id, p_delta, p_method, auth.uid());

  return v_result;
end;
$$;

grant execute on function public.adjust_wallet_balance(uuid, integer, text) to authenticated;
