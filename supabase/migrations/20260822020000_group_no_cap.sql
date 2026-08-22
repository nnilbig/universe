-- WHONEXT UNIVERSE — remove the 團體報名 group size cap entirely (每人不限追加人數)
-- Paste into Supabase Dashboard > SQL Editor > New query, run once after 20260822010000.

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
  if array_length(p_nicknames, 1) is null then
    raise exception '至少需要 1 人';
  end if;

  for v_index in 1 .. array_length(p_nicknames, 1) loop
    insert into public.registrations (activity_id, kind, group_id, nickname, checked_in, is_primary)
    values (p_activity_id, 'guest', v_group_id, p_nicknames[v_index], false, v_index = 1);
  end loop;

  return query select * from public.registrations where group_id = v_group_id;
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
  v_result public.registrations;
begin
  select activity_id into v_activity_id
  from public.registrations
  where group_id = p_group_id
  limit 1;

  if v_activity_id is null then
    raise exception '找不到該報名團';
  end if;

  insert into public.registrations (activity_id, kind, group_id, nickname, checked_in, is_primary)
  values (v_activity_id, 'guest', p_group_id, p_nickname, false, false)
  returning * into v_result;

  return v_result;
end;
$$;
