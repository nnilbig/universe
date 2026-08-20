-- WHONEXT UNIVERSE — role/permission model
-- Paste into Supabase Dashboard > SQL Editor > New query, run once after the init migration.
--
-- Five-tier model: 訪客(guest) / 一般(player) / 訂閱(subscriber) / 管理員(admin) / owner.
-- 訪客 isn't a stored role — it's an unauthenticated session (no profiles row at all), already
-- handled by the guest PIN flow (register_guest/cancel_guest_registration) which is exactly the
-- "not quick registration" path guests use. 一般/訂閱 aren't behaviourally different yet — this
-- just reserves 'subscriber' for later. admin/owner both get: host activities, manually add/remove
-- registrants, check in attendees, manage wallet balances. owner additionally can promote accounts
-- to admin.

-- Any existing 'captain' rows fold into 'admin' before the constraint below stops allowing them.
update public.profiles set role = 'admin' where role = 'captain';

alter table public.profiles drop constraint profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('player', 'subscriber', 'admin', 'owner'));

-- ============================================================================
-- Replace every 'captain'/'admin' RLS check with 'admin'/'owner'.
-- ============================================================================
drop policy "organizers update check-ins for their activity" on public.registrations;
create policy "organizers update check-ins for their activity" on public.registrations
  for update using (
    exists (
      select 1 from public.activities a
      where a.id = registrations.activity_id and a.organizer_id = auth.uid()
    )
    or exists (
      select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'owner')
    )
  );

create or replace function public.enforce_registration_update_scope()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_organizer boolean;
begin
  select
    exists (
      select 1 from public.activities a
      where a.id = new.activity_id and a.organizer_id = auth.uid()
    )
    or exists (
      select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'owner')
    )
    into v_is_organizer;

  if v_is_organizer then
    if new.avatar_url is distinct from old.avatar_url
       or new.nickname is distinct from old.nickname
       or new.profile_id is distinct from old.profile_id then
      raise exception 'organizers may only update checked_in';
    end if;
  else
    if new.checked_in is distinct from old.checked_in then
      raise exception 'checked_in can only be changed by the activity organizer';
    end if;
  end if;

  return new;
end;
$$;

-- ============================================================================
-- 舉辦活動 — admin/owner can host their own activities (organizer_id must be themselves; the
-- existing "organizers manage their own activities" update policy already covers editing it after).
-- ============================================================================
create policy "admins and owners create activities" on public.activities
  for insert with check (
    organizer_id = auth.uid()
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'owner'))
  );

-- ============================================================================
-- 手動新增/刪除報名人員 — admin/owner may insert or delete ANY registration row (both kind='line'
-- and kind='guest'), on top of the self-scoped policies a normal registrant already has.
-- ============================================================================
create policy "admins and owners create any registration" on public.registrations
  for insert with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'owner'))
  );

create policy "admins and owners delete any registration" on public.registrations
  for delete using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'owner'))
  );

-- ============================================================================
-- 管理錢包餘額 — profiles' own "update own profile" policy only lets a user touch their own row,
-- so admin/owner need a SECURITY DEFINER RPC to adjust someone else's wallet_balance. Delta-based
-- (not a direct set) so it composes with concurrent adjustments; floors at 0.
-- ============================================================================
create or replace function public.adjust_wallet_balance(p_user_id uuid, p_delta integer)
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

  update public.profiles
  set wallet_balance = greatest(0, wallet_balance + p_delta)
  where id = p_user_id
  returning * into v_result;

  if v_result is null then
    raise exception 'profile % not found', p_user_id;
  end if;

  return v_result;
end;
$$;

grant execute on function public.adjust_wallet_balance(uuid, integer) to authenticated;

-- ============================================================================
-- 指派他人為管理員 — owner-only. Deliberately can't assign 'owner' through this RPC (that stays a
-- manual DB action), so a compromised or mistaken admin/owner session can't mint another owner.
-- ============================================================================
create or replace function public.assign_role(p_user_id uuid, p_role text)
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
  if v_caller_role is distinct from 'owner' then
    raise exception 'only owner may assign roles';
  end if;
  if p_role not in ('player', 'subscriber', 'admin') then
    raise exception 'invalid role: %', p_role;
  end if;

  update public.profiles set role = p_role
  where id = p_user_id
  returning * into v_result;

  if v_result is null then
    raise exception 'profile % not found', p_user_id;
  end if;

  return v_result;
end;
$$;

grant execute on function public.assign_role(uuid, text) to authenticated;
