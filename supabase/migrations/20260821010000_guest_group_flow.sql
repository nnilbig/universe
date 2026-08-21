-- WHONEXT UNIVERSE — guest group flow: primary/companion registrations, group-cascade cancel
-- Paste into Supabase Dashboard > SQL Editor > New query, run once after 20260821000000.
--
-- Backs the redesigned 訪客報名 flow: registering fills up to 4 nicknames (1 required 主報名者 +
-- up to 3 optional 友人), each guest row now knows whether it's the primary via is_primary.
-- Cancelling the primary cascades to the whole group (their friends came in on their invite);
-- cancelling anyone else only removes that one row. add_guest_companion lets a guest top up an
-- existing group later (補充報名) without re-registering everyone.

alter table public.registrations add column is_primary boolean not null default false;

drop function if exists public.register_guest(uuid, text[]);
drop function if exists public.cancel_guest_registration(uuid, text);

create or replace function public.register_guest(p_activity_id uuid, p_nicknames text[])
returns setof public.registrations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group_id uuid := gen_random_uuid();
  v_index int;
begin
  if array_length(p_nicknames, 1) is null or array_length(p_nicknames, 1) not between 1 and 4 then
    raise exception '人數需為 1 到 4 人';
  end if;

  for v_index in 1 .. array_length(p_nicknames, 1) loop
    insert into public.registrations (activity_id, kind, group_id, nickname, checked_in, is_primary)
    values (p_activity_id, 'guest', v_group_id, p_nicknames[v_index], false, v_index = 1);
  end loop;

  return query select * from public.registrations where group_id = v_group_id;
end;
$$;

create or replace function public.cancel_guest_registration(p_registration_id uuid, p_nickname text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nickname text;
  v_group_id uuid;
  v_is_primary boolean;
begin
  select nickname, group_id, is_primary into v_nickname, v_group_id, v_is_primary
  from public.registrations
  where id = p_registration_id and kind = 'guest';

  if v_nickname is null then
    raise exception '找不到該筆訪客報名';
  end if;
  if v_nickname is distinct from p_nickname then
    raise exception '暱稱不符';
  end if;

  if v_is_primary then
    delete from public.registrations where group_id = v_group_id;
  else
    delete from public.registrations where id = p_registration_id;
  end if;
end;
$$;

create or replace function public.add_guest_companion(p_group_id uuid, p_nickname text)
returns public.registrations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_activity_id uuid;
  v_count int;
  v_result public.registrations;
begin
  select activity_id, count(*) over () into v_activity_id, v_count
  from public.registrations
  where group_id = p_group_id and kind = 'guest'
  limit 1;

  if v_activity_id is null then
    raise exception '找不到該報名團';
  end if;
  if v_count >= 4 then
    raise exception '此團已達 4 人上限';
  end if;

  insert into public.registrations (activity_id, kind, group_id, nickname, checked_in, is_primary)
  values (v_activity_id, 'guest', p_group_id, p_nickname, false, false)
  returning * into v_result;

  return v_result;
end;
$$;

grant execute on function public.register_guest(uuid, text[]) to anon, authenticated;
grant execute on function public.cancel_guest_registration(uuid, text) to anon, authenticated;
grant execute on function public.add_guest_companion(uuid, text) to anon, authenticated;
