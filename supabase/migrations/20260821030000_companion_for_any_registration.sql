-- WHONEXT UNIVERSE — let 補充報名 attach to a LINE member's registration too
-- Paste into Supabase Dashboard > SQL Editor > New query, run once after 20260821020000.
--
-- add_guest_companion looked up the group's activity_id/headcount via `where group_id = ... and
-- kind = 'guest'`, so it only worked when the group already had a guest 主報名者 in it. A LINE
-- member's own registration is kind = 'line' with no other member yet, so adding their first
-- companion always failed with "找不到該報名團". Drops the kind filter — any registration
-- (line or guest) anchoring the group_id is enough to look it up.

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
  where group_id = p_group_id
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
